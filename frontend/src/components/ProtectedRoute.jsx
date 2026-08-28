import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute - Enforces Role-Based Access Control
 * @param {Object} props
 * @param {Object|null} props.user Current authenticated user object
 * @param {string[]} [props.allowedRoles] Array of allowed roles for this route
 * @param {React.ReactNode} props.children
 */
export default function ProtectedRoute({ user, allowedRoles, children }) {
  // If user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required and user's role is not allowed, redirect to their own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'Buyer') return <Navigate to="/buyer" replace />;
    if (user.role === 'Seller') return <Navigate to="/seller" replace />;
    if (user.role === 'Investor') return <Navigate to="/investor" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
