import React from 'react';
import { Link } from 'react-router-dom';
import { Vendor } from '../../types';
import { MapPin, Clock, ArrowRight } from 'lucide-react';

interface VendorCardProps {
  vendor: Vendor;
}

export const VendorCard: React.FC<VendorCardProps> = ({ vendor }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full group">
      {/* Banner / Header Image */}
      <div className="relative h-40 bg-slate-100 overflow-hidden">
        <img
          src={
            vendor.logo ||
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
          }
          alt={vendor.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
              vendor.isOpen
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800/80 text-white backdrop-blur-xs'
            }`}
          >
            {vendor.isOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg text-slate-900 group-hover:text-orange-600 transition leading-snug">
            {vendor.name}
          </h3>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
            {vendor.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-y-2 gap-x-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span>{vendor.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>~{vendor.estimatedPreparationTime || 15} mins prep</span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            Hours: {vendor.openingTime} - {vendor.closingTime}
          </span>
          <Link
            to={`/student/vendor/${vendor._id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 group-hover:translate-x-0.5 transition"
          >
            View Menu
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
