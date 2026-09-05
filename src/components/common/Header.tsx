import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useSocket } from '../../context/SocketContext';
import {
  UtensilsCrossed,
  ShoppingBag,
  Clock,
  User as UserIcon,
  LogOut,
  ChefHat,
  ShieldCheck,
  Store,
  Layers,
  Settings,
  Users,
  FileText,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-600/20 group-hover:bg-orange-700 transition">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block leading-tight">
                CAMPUS EATS
              </span>
              <span className="text-[10px] uppercase font-semibold text-orange-600 tracking-wider block">
                Smart Food & Queue
              </span>
            </div>
          </Link>

          {/* Real-time connection badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span className="text-[11px] font-medium">
              {isConnected ? 'Live Socket' : 'Connecting'}
            </span>
          </div>
        </div>

        {/* Navigation according to User Role */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {user?.role === 'student' && (
            <>
              <Link
                to="/student"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  location.pathname === '/student'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Vendors</span>
              </Link>

              <Link
                to="/student/orders"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  location.pathname.startsWith('/student/orders')
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Orders</span>
              </Link>

              <Link
                to="/student/cart"
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  location.pathname === '/student/cart'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Cart</span>
                {totalCartCount > 0 && (
                  <span className="ml-0.5 bg-orange-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {totalCartCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {user?.role === 'vendor' && (
            <>
              <Link
                to="/vendor"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  location.pathname === '/vendor'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ChefHat className="w-4 h-4" />
                <span>Kitchen Queue</span>
              </Link>

              <Link
                to="/vendor/menu"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  location.pathname === '/vendor/menu'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Menu</span>
              </Link>

              <Link
                to="/vendor/settings"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  location.pathname === '/vendor/settings'
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  location.pathname === '/admin'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/admin/vendors"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  location.pathname.startsWith('/admin/vendors')
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Vendors</span>
              </Link>

              <Link
                to="/admin/users"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  location.pathname === '/admin/users'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Users</span>
              </Link>

              <Link
                to="/admin/orders"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                  location.pathname === '/admin/orders'
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>All Orders</span>
              </Link>
            </>
          )}

          {/* User Account Dropdown / Actions */}
          <div className="ml-2 pl-2 border-l border-slate-200 flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2"
                >
                  Log In
                </Link>
                <Link
                  to="/register/student"
                  className="text-xs sm:text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 px-3.5 py-1.5 rounded-lg shadow-xs transition"
                >
                  Order Food
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
