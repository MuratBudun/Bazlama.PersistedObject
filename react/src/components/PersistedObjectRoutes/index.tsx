/**
 * PersistedObjectRoutes - React Router integration for PersistedObjectCrud.
 * 
 * This component automatically sets up routes for CRUD operations:
 * - /path         -> List view
 * - /path/create  -> Create form
 * - /path/:id     -> Detail view
 * - /path/:id/edit -> Edit form
 * 
 * Usage:
 *   <Routes>
 *     <Route path="/settings/*" element={<PersistedObjectRoutes api="/api/settings" title="Settings" />} />
 *   </Routes>
 */

import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { PersistedObjectCrud } from '../PersistedObjectCrud';
import { PersistedObjectCrudProps } from '../PersistedObjectCrud';

export interface PersistedObjectRoutesProps extends Omit<PersistedObjectCrudProps, 'initialView' | 'initialItemId' | 'onCancel'> {
  /** Base path for routes (optional, auto-detected from current route) */
  basePath?: string;
}

// Wrapper components to access useParams inside the Route
function DetailRoute(props: Omit<PersistedObjectCrudProps, 'initialView' | 'initialItemId'>) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  return (
    <PersistedObjectCrud 
      {...props}
      initialView="detail"
      initialItemId={id}
      onCancel={() => navigate(-1)}
    />
  );
}

function EditRoute(props: Omit<PersistedObjectCrudProps, 'initialView' | 'initialItemId'>) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  return (
    <PersistedObjectCrud 
      {...props}
      initialView="edit"
      initialItemId={id}
      onUpdateSuccess={() => navigate(-1)}
      onCancel={() => navigate(-1)}
    />
  );
}

export function PersistedObjectRoutes(props: PersistedObjectRoutesProps) {
  const navigate = useNavigate();
  const { viewMode = 'page', ...restProps } = props;

  return (
    <Routes>
      {/* List view */}
      <Route index element={
        <PersistedObjectCrud 
          {...restProps}
          viewMode={viewMode}
          onCreateSuccess={() => navigate(-1)}
          onUpdateSuccess={() => navigate(-1)}
          onDeleteSuccess={() => {}}
        />
      } />
      
      {/* Create form */}
      <Route path="create" element={
        <PersistedObjectCrud 
          {...restProps}
          viewMode={viewMode}
          initialView="create"
          onCreateSuccess={() => navigate(-1)}
          onCancel={() => navigate(-1)}
        />
      } />
      
      {/* Detail view */}
      <Route path=":id" element={
        <DetailRoute {...restProps} viewMode={viewMode} />
      } />
      
      {/* Edit form */}
      <Route path=":id/edit" element={
        <EditRoute {...restProps} viewMode={viewMode} />
      } />
    </Routes>
  );
}
