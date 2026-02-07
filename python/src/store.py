"""
Store class for CRUD operations on PersistedObject models.

Provides database operations with SQLAlchemy integration.
Supports both synchronous and asynchronous operations.
"""

from typing import Any, Dict, Generic, List, Optional, Tuple, Type, TypeVar, Union
import json

from pydantic import BaseModel
from sqlalchemy import select, func, and_, or_, asc, desc, text
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.expression import ClauseElement
from sqlalchemy.sql._typing import _ColumnExpressionArgument

from .base import PersistedObject
from .sqlalchemy_models import create_table_class
from .exceptions import ModelNotFoundError, DuplicateKeyError

ModelType = TypeVar("ModelType", bound=PersistedObject)


class StoreFilterResult(BaseModel):
    """
    Result container for filter operations.
    
    Attributes:
        items: List of filtered items (as models or dicts)
        total: Total number of matching records
        skip: Number of skipped records (pagination)
        limit: Maximum number of records requested
        fetch: Actual number of records returned
        use_model_output: Whether items are model instances or dicts
        disable_total_query: Whether total count query was skipped
    """
    items: Union[List[Any], List[Dict[str, Any]]]
    total: int
    skip: int
    limit: int
    fetch: int
    use_model_output: bool = False
    disable_total_query: bool = False


class Store(Generic[ModelType]):
    """
    Store class for CRUD operations on PersistedObject models.
    
    This class provides methods for creating, reading, updating, and deleting
    objects of a specific model type from a database.
    
    Example:
        from sqlalchemy.orm import Session
        
        # Create a store for the Category model
        store = Store(Category)
        
        # Create a new category
        category = Category(id="tech", title="Technology", slug="tech")
        created = store.create(db, category)
        
        # Get by ID
        category = store.get(db, "tech")
        
        # List with pagination
        items, total = store.list(db, skip=0, limit=20)
        
        # Update
        category.title = "Technology & Science"
        updated = store.update(db, category)
        
        # Delete
        store.delete(db, "tech")
    """
    
    def __init__(
        self,
        model: Type[ModelType],
        metadata: Any = None,
        db_table_prefix: str = "",
        db_table_suffix: str = ""
    ) -> None:
        """
        Initialize a Store for the given model type.
        
        Args:
            model: The PersistedObject model class
            metadata: Optional SQLAlchemy MetaData instance
            db_table_prefix: Optional prefix for table name
            db_table_suffix: Optional suffix for table name
        """
        self.model = model
        self.table_name = f"{db_table_prefix}{model.__table_name__}{db_table_suffix}"
        self.primary_key = model.__primary_key__
        self.indexed_fields = model.__indexed_fields__
        self.unique_fields = getattr(model, "__unique_fields__", [])
        
        # Check if encryption is enabled for this model
        encrypt_json = getattr(model, "__encrypt_json__", False)
        
        # Extract field types and metadata
        field_types = {}
        field_metadata = {}
        
        for field_name in self.indexed_fields:
            field_info = model.model_fields[field_name]
            field_type = field_info.annotation
            
            # Extract field metadata
            meta = {}
            
            # Handle max_length for string fields
            if hasattr(field_info, 'json_schema_extra') and field_info.json_schema_extra:
                if isinstance(field_info.json_schema_extra, dict):
                    meta.update(field_info.json_schema_extra)
            
            # Check field constraints for max_length
            for constraint in field_info.metadata:
                if hasattr(constraint, 'max_length'):
                    meta['max_length'] = constraint.max_length
            
            # Handle Optional types
            if field_type is not None and hasattr(field_type, "__origin__") and field_type.__origin__ is Optional:
                field_type = field_type.__args__[0]
                         
            field_types[field_name] = field_type
            field_metadata[field_name] = meta
        
        # Create SQLAlchemy table model
        self.db_model = create_table_class(
            table_name=self.table_name,
            primary_key=self.primary_key,
            field_types=field_types,
            metadata=metadata,
            field_metadata=field_metadata,
            unique_fields=self.unique_fields,
            encrypt_json=encrypt_json
        )
    
    def get_column_names(self, exclude_json_data: bool = True) -> List[str]:
        """
        Get the names of the columns in the database model.
        
        Args:
            exclude_json_data: If True, exclude json_data from the list
        
        Returns:
            A list of column names
        """
        if exclude_json_data:
            return [column.name for column in self.db_model.__table__.columns if column.name != "json_data"]
        else:
            return [column.name for column in self.db_model.__table__.columns]

    def get_column_types(self) -> Dict[str, Type]:
        """
        Get the types of the columns in the database model.
        
        Returns:
            A dictionary mapping column names to their types, excluding json_data
        """
        return {column.name: column.type for column in self.db_model.__table__.columns if column.name != "json_data"}
    
    # ==================== Synchronous Methods ====================
    
    def get(self, db: Session, id_value: Any) -> Optional[ModelType]:
        """
        Get an object by primary key.
        
        Args:
            db: SQLAlchemy session
            id_value: Primary key value
            
        Returns:
            Model instance if found, None otherwise
        """
        stmt = select(self.db_model).where(
            getattr(self.db_model, self.primary_key) == id_value
        )
        result = db.execute(stmt).first()
        
        if result is None:
            return None
        
        db_obj = result[0]
        # json_data is already deserialized by JSONType
        json_data = db_obj.json_data
        return self.model.model_validate(json_data)
    
    def create(self, db: Session, obj: ModelType) -> ModelType:
        """
        Create a new object in the database.
        
        Args:
            db: SQLAlchemy session
            obj: Model instance to create
            
        Returns:
            Created model instance
            
        Raises:
            DuplicateKeyError: If primary key already exists
        """
        # Convert to database dict
        db_dict = obj.to_db_dict()
        
        # json_data should be the Pydantic model itself
        # JSONType will handle serialization
        if "json_data" in db_dict:
            db_dict["json_data"] = obj
        
        # Create database object
        db_obj = self.db_model(**db_dict)
        
        try:
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)
            
            # Return the created object (json_data already deserialized)
            return self.model.model_validate(db_obj.json_data)
            
        except IntegrityError as e:
            db.rollback()
            error_msg = str(e).lower()
            if "unique constraint" in error_msg or "duplicate" in error_msg:
                pk_value = getattr(obj, self.primary_key)
                raise DuplicateKeyError(
                    model_name=self.model.__name__,
                    primary_key=self.primary_key,
                    value=pk_value
                )
            raise
    
    def update(self, db: Session, obj: ModelType) -> ModelType:
        """
        Update an existing object.
        
        Args:
            db: SQLAlchemy session
            obj: Model instance with updated values
            
        Returns:
            Updated model instance
            
        Raises:
            ModelNotFoundError: If object doesn't exist
        """
        id_value = getattr(obj, self.primary_key)
        
        stmt = select(self.db_model).where(
            getattr(self.db_model, self.primary_key) == id_value
        )
        result = db.execute(stmt).first()
        
        if result is None:
            raise ModelNotFoundError(
                model_name=self.model.__name__,
                primary_key=self.primary_key,
                value=id_value
            )
        
        db_obj = result[0]
        
        # Update fields - JSONType will handle serialization
        db_dict = obj.to_db_dict()
        if "json_data" in db_dict:
            db_dict["json_data"] = obj
        
        for key, value in db_dict.items():
            setattr(db_obj, key, value)
        
        db.commit()
        db.refresh(db_obj)
        
        # json_data already deserialized
        return self.model.model_validate(db_obj.json_data)
    
    def delete(self, db: Session, id_value: Any) -> bool:
        """
        Delete an object by primary key.
        
        Args:
            db: SQLAlchemy session
            id_value: Primary key value
            
        Returns:
            True if deleted, False if not found
        """
        stmt = select(self.db_model).where(
            getattr(self.db_model, self.primary_key) == id_value
        )
        result = db.execute(stmt).first()
        
        if result is None:
            return False
        
        db_obj = result[0]
        db.delete(db_obj)
        db.commit()
        return True
    
    def list(
        self,
        db: Session,
        filters: Optional[Dict[str, Any]] = None,
        skip: int = 0,
        limit: int = 100,
        order_by: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[ModelType], int]:
        """
        List objects with pagination and filtering.
        
        Args:
            db: SQLAlchemy session
            filters: Dictionary of field:value filters
            skip: Number of records to skip (offset)
            limit: Maximum number of records to return
            order_by: Field name to order by (prefix with - for descending)
            search: Search string to match against indexed fields
            
        Returns:
            Tuple of (items list, total count)
            
        Example:
            items, total = store.list(
                db,
                filters={"is_active": True},
                skip=0,
                limit=20,
                order_by="-created_at",
                search="technology"
            )
        """
        # Build base query
        stmt = select(self.db_model)
        count_stmt = select(func.count()).select_from(self.db_model)
        
        # Apply filters
        if filters:
            conditions = []
            for field_name, value in filters.items():
                if hasattr(self.db_model, field_name):
                    conditions.append(getattr(self.db_model, field_name) == value)
            
            if conditions:
                filter_clause = and_(*conditions)
                stmt = stmt.where(filter_clause)
                count_stmt = count_stmt.where(filter_clause)
        
        # Apply search across indexed fields
        if search:
            search_conditions = []
            search_term = f"%{search}%"
            
            # Search in indexed string fields
            for field_name in self.indexed_fields:
                if hasattr(self.db_model, field_name):
                    field = getattr(self.db_model, field_name)
                    # Check if it's a string-type field
                    if hasattr(field.type, 'python_type'):
                        try:
                            if field.type.python_type == str:
                                search_conditions.append(field.ilike(search_term))
                        except (AttributeError, NotImplementedError):
                            # Some types don't support python_type
                            pass
            
            # Also search in json_data for full-text search
            if hasattr(self.db_model, 'json_data'):
                search_conditions.append(self.db_model.json_data.ilike(search_term))
            
            if search_conditions:
                search_clause = or_(*search_conditions)
                stmt = stmt.where(search_clause)
                count_stmt = count_stmt.where(search_clause)
        
        # Get total count
        total = db.execute(count_stmt).scalar() or 0
        
        # Apply ordering
        if order_by:
            if order_by.startswith("-"):
                field_name = order_by[1:]
                if hasattr(self.db_model, field_name):
                    stmt = stmt.order_by(getattr(self.db_model, field_name).desc())
            else:
                if hasattr(self.db_model, order_by):
                    stmt = stmt.order_by(getattr(self.db_model, order_by).asc())
        
        # Apply pagination
        stmt = stmt.offset(skip).limit(limit)
        
        # Execute query
        results = db.execute(stmt).all()
        
        # Convert to model instances (json_data already deserialized)
        items = []
        for result in results:
            db_obj = result[0]
            items.append(self.model.model_validate(db_obj.json_data))
        
        return items, total
    
    def get_all(self, db: Session) -> List[ModelType]:
        """
        Get all objects (no pagination).
        
        Args:
            db: SQLAlchemy session
            
        Returns:
            List of all model instances
            
        Warning:
            Use with caution on large tables. Prefer list() with pagination.
        """
        items, _ = self.list(db, skip=0, limit=999999)
        return items
    
    def filter(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: Optional[int] = 10,
        where: Optional[Union[_ColumnExpressionArgument[bool], List[_ColumnExpressionArgument[bool]]]] = None,
        order_by: Optional[Union[str, List[str], ClauseElement, List[ClauseElement]]] = None,
        use_model_output: bool = False,
        disable_total_query: bool = False
    ) -> StoreFilterResult:
        """
        Filter objects using SQLAlchemy expressions.
        
        Args:
            db: SQLAlchemy session
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return (None for no limit)
            where: SQLAlchemy conditions to filter by. Can be:
                - A single SQLAlchemy expression
                - A list of expressions (combined with AND)
            order_by: Sorting criteria. Can be:
                - A string column name (prefix with "-" for descending)
                - A list of string column names
                - SQLAlchemy order expressions
            use_model_output: If True, return model objects; if False, return dictionaries
            disable_total_query: If True, skip counting total records (for performance)
            
        Returns:
            StoreFilterResult containing:
                - items: List of filtered objects (as models or dictionaries)
                - total: Total number of matching records (before pagination)
                - pagination metadata and filter settings
                
        Example:
            # Filter categories with is_active=True, sorted by title
            result = store.filter(
                db,
                where=Category.is_active == True,
                order_by="title",
                limit=20
            )
            
            # Multiple conditions with dict output for performance
            result = store.filter(
                db,
                where=[Category.is_active == True, Category.slug.like("%tech%")],
                order_by=["-_created_at", "title"],
                use_model_output=False,
                disable_total_query=True
            )
        """
        # Start with a basic query
        if use_model_output:
            query = select(self.db_model.json_data)
            columns = []  # Not used when use_model_output is True
        else:
            columns = self.get_column_names()
            columns = [getattr(self.db_model, col) for col in columns]
            query = select(*columns)
        
        # Apply WHERE conditions
        if where is not None:
            if isinstance(where, list):
                query = query.where(and_(*where))
            elif isinstance(where, tuple):
                if len(where) == 1:
                    query = query.where(where[0])
                else:
                    query = query.where(and_(*where))
            else:
                query = query.where(where)

        # Apply ORDER BY if specified
        if order_by is not None:
            order_expressions = []
            
            if isinstance(order_by, list):
                # Process a list of order expressions
                for ob in order_by:
                    if isinstance(ob, str):
                        # String format: "-column_name" for DESC, "column_name" for ASC
                        if ob.startswith("-"):
                            order_expressions.append(desc(text(ob[1:])))
                        else:
                            order_expressions.append(asc(text(ob)))
                    else:
                        # Already an SQLAlchemy expression
                        order_expressions.append(ob)
            else:
                # Single order expression
                if isinstance(order_by, str):
                    if order_by.startswith("-"):
                        order_expressions.append(desc(text(order_by[1:])))
                    else:
                        order_expressions.append(asc(text(order_by)))
                else:
                    order_expressions.append(order_by)
                
            query = query.order_by(*order_expressions)
        
        total = 0

        if not disable_total_query:
            count_query = select(func.count()).select_from(query.subquery())
            count_result = db.execute(count_query)
            total = count_result.scalar() or 0

            if total == 0:
                return StoreFilterResult(
                    items=[],
                    total=0,
                    limit=limit or 0,
                    skip=skip,
                    fetch=0,
                    use_model_output=use_model_output,
                    disable_total_query=disable_total_query
                )
                    
        # Apply pagination
        if skip > 0:
            query = query.offset(skip)
        
        if limit is not None:
            query = query.limit(limit)
        
        # Execute the query and process results
        result = db.execute(query)
        
        if use_model_output:
            rows = result.scalars().all()
            result_data = []
            for row in rows:
                model_value = self.model.model_validate(row)
                result_data.append(model_value)
        else:
            rows = result.all()
            # Process the results into a list of dictionaries
            result_data = []
            for row in rows:
                row_data = {}
                for idx, column in enumerate(columns):
                    row_data[column.name] = row[idx]
                result_data.append(row_data)
        
        return StoreFilterResult(
            items=result_data,
            total=total,
            limit=limit or 0,
            skip=skip,
            fetch=len(result_data),
            use_model_output=use_model_output,
            disable_total_query=disable_total_query
        )
    
    # ==================== Async Methods ====================
    
    async def aget(self, db: AsyncSession, id_value: Any) -> Optional[ModelType]:
        """Async version of get()."""
        stmt = select(self.db_model).where(
            getattr(self.db_model, self.primary_key) == id_value
        )
        result = await db.execute(stmt)
        row = result.first()
        
        if row is None:
            return None
        
        db_obj = row[0]
        # json_data already deserialized by JSONType
        return self.model.model_validate(db_obj.json_data)
    
    async def acreate(self, db: AsyncSession, obj: ModelType) -> ModelType:
        """Async version of create()."""
        db_dict = obj.to_db_dict()
        
        # json_data should be the Pydantic model, JSONType handles serialization
        if "json_data" in db_dict:
            db_dict["json_data"] = obj
        
        db_obj = self.db_model(**db_dict)
        
        try:
            db.add(db_obj)
            await db.commit()
            await db.refresh(db_obj)
            
            # json_data already deserialized
            return self.model.model_validate(db_obj.json_data)
            
        except IntegrityError as e:
            await db.rollback()
            if "unique constraint" in str(e).lower() or "duplicate" in str(e).lower():
                pk_value = getattr(obj, self.primary_key)
                raise DuplicateKeyError(
                    model_name=self.model.__name__,
                    primary_key=self.primary_key,
                    value=pk_value
                )
            raise
    
    async def aupdate(self, db: AsyncSession, obj: ModelType) -> ModelType:
        """Async version of update()."""
        id_value = getattr(obj, self.primary_key)
        
        stmt = select(self.db_model).where(
            getattr(self.db_model, self.primary_key) == id_value
        )
        result = await db.execute(stmt)
        row = result.first()
        
        if row is None:
            raise ModelNotFoundError(
                model_name=self.model.__name__,
                primary_key=self.primary_key,
                value=id_value
            )
        
        db_obj = row[0]
        db_dict = obj.to_db_dict()
        
        # JSONType will handle serialization
        if "json_data" in db_dict:
            db_dict["json_data"] = obj
        
        for key, value in db_dict.items():
            setattr(db_obj, key, value)
        
        await db.commit()
        await db.refresh(db_obj)
        
        # json_data already deserialized
        return self.model.model_validate(db_obj.json_data)
    
    async def adelete(self, db: AsyncSession, id_value: Any) -> bool:
        """Async version of delete()."""
        stmt = select(self.db_model).where(
            getattr(self.db_model, self.primary_key) == id_value
        )
        result = await db.execute(stmt)
        row = result.first()
        
        if row is None:
            return False
        
        db_obj = row[0]
        await db.delete(db_obj)
        await db.commit()
        return True
    
    async def alist(
        self,
        db: AsyncSession,
        filters: Optional[Dict[str, Any]] = None,
        skip: int = 0,
        limit: int = 100,
        order_by: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[ModelType], int]:
        """Async version of list()."""
        stmt = select(self.db_model)
        count_stmt = select(func.count()).select_from(self.db_model)
        
        if filters:
            conditions = []
            for field_name, value in filters.items():
                if hasattr(self.db_model, field_name):
                    conditions.append(getattr(self.db_model, field_name) == value)
            
            if conditions:
                filter_clause = and_(*conditions)
                stmt = stmt.where(filter_clause)
                count_stmt = count_stmt.where(filter_clause)
        
        # Apply search across indexed fields
        if search:
            search_conditions = []
            search_term = f"%{search}%"
            
            # Search in indexed string fields
            for field_name in self.indexed_fields:
                if hasattr(self.db_model, field_name):
                    field = getattr(self.db_model, field_name)
                    # Check if it's a string-type field
                    if hasattr(field.type, 'python_type'):
                        try:
                            if field.type.python_type == str:
                                search_conditions.append(field.ilike(search_term))
                        except (AttributeError, NotImplementedError):
                            # Some types don't support python_type
                            pass
            
            # Also search in json_data for full-text search
            if hasattr(self.db_model, 'json_data'):
                search_conditions.append(self.db_model.json_data.ilike(search_term))
            
            if search_conditions:
                search_clause = or_(*search_conditions)
                stmt = stmt.where(search_clause)
                count_stmt = count_stmt.where(search_clause)
        
        result = await db.execute(count_stmt)
        total = result.scalar() or 0
        
        if order_by:
            if order_by.startswith("-"):
                field_name = order_by[1:]
                if hasattr(self.db_model, field_name):
                    stmt = stmt.order_by(getattr(self.db_model, field_name).desc())
            else:
                if hasattr(self.db_model, order_by):
                    stmt = stmt.order_by(getattr(self.db_model, order_by).asc())
        
        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        rows = result.all()
        
        # Convert to model instances (json_data already deserialized)
        items = []
        for row in rows:
            db_obj = row[0]
            items.append(self.model.model_validate(db_obj.json_data))
        
        return items, total
    
    async def filter_async(
        self,
        db: AsyncSession,
        *,
        skip: int = 0,
        limit: Optional[int] = 10,
        where: Optional[Union[_ColumnExpressionArgument[bool], List[_ColumnExpressionArgument[bool]]]] = None,
        order_by: Optional[Union[str, List[str], ClauseElement, List[ClauseElement]]] = None,
        use_model_output: bool = False,
        disable_total_query: bool = False
    ) -> StoreFilterResult:
        """
        Async version of filter() with SQLAlchemy expressions.
        
        Args:
            db: SQLAlchemy async session
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return (None for no limit)
            where: SQLAlchemy conditions to filter by
            order_by: Sorting criteria (string or SQLAlchemy expressions)
            use_model_output: If True, return model objects; if False, return dictionaries
            disable_total_query: If True, skip counting total records (for performance)
            
        Returns:
            StoreFilterResult containing filtered items and metadata
        """
        if use_model_output:
            query = select(self.db_model.json_data)
            columns = []
        else:
            columns = self.get_column_names()
            columns = [getattr(self.db_model, col) for col in columns]
            query = select(*columns)
            
        # Apply WHERE conditions
        if where is not None:
            if isinstance(where, list):
                query = query.where(and_(*where))
            elif isinstance(where, tuple):
                if len(where) == 1:
                    query = query.where(where[0])
                else:
                    query = query.where(and_(*where))
            else:
                query = query.where(where)

        # Apply ORDER BY if specified
        if order_by is not None:
            order_expressions = []
            
            if isinstance(order_by, list):
                for ob in order_by:
                    if isinstance(ob, str):
                        if ob.startswith("-"):
                            order_expressions.append(desc(text(ob[1:])))
                        else:
                            order_expressions.append(asc(text(ob)))
                    else:
                        order_expressions.append(ob)
            else:
                if isinstance(order_by, str):
                    if order_by.startswith("-"):
                        order_expressions.append(desc(text(order_by[1:])))
                    else:
                        order_expressions.append(asc(text(order_by)))
                else:
                    order_expressions.append(order_by)
                    
            query = query.order_by(*order_expressions)

        total = 0

        if not disable_total_query:
            count_query = select(func.count()).select_from(query.subquery())
            count_result = await db.execute(count_query)
            total = count_result.scalar_one() or 0

            if total == 0:
                return StoreFilterResult(
                    items=[],
                    total=0,
                    limit=limit or 0,
                    skip=skip,
                    fetch=0,
                    use_model_output=use_model_output,
                    disable_total_query=disable_total_query
                )
            
        # Apply pagination
        if skip > 0:
            query = query.offset(skip)
        
        if limit is not None:
            query = query.limit(limit)
        
        result = await db.execute(query)
        
        if use_model_output:
            rows = result.scalars().all()
            result_data = []
            for row in rows:
                model_value = self.model.model_validate(row)
                result_data.append(model_value)
        else:
            rows = result.all()
            result_data = []
            for row in rows:
                row_data = {}
                for idx, column in enumerate(columns):
                    row_data[column.name] = row[idx]
                result_data.append(row_data)
        
        return StoreFilterResult(
            items=result_data,
            total=total,
            limit=limit or 0,
            skip=skip,
            fetch=len(result_data),
            use_model_output=use_model_output,
            disable_total_query=disable_total_query
        )
