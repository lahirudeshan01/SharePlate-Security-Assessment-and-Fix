import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DonationCard({ donation }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const uiStatus = donation?.uiStatus || 'available';
  const isAvailable = uiStatus === 'available';

  const handleRequestClick = () => {
    if (!isAvailable) {
      alert('This donation is not available for new requests right now');
      return;
    }
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'shelter') {
      alert('Only shelters can request donations');
      return;
    }
    navigate(`/create-request/${donation._id}`);
  };

  const expiryDate = donation?.expiryDate ? new Date(donation.expiryDate) : null;
  const isValidExpiry = expiryDate instanceof Date && !Number.isNaN(expiryDate?.getTime?.());
  const daysLeft = isValidExpiry
    ? Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiring = typeof daysLeft === 'number' && daysLeft < 2;
  const isExpired = typeof daysLeft === 'number' && daysLeft <= 0;
  const donorName =
    donation?.donor?.organizationName ||
    donation?.donor?.name ||
    'Unknown donor';
  const quantityLabel = Number.isFinite(Number(donation?.quantity)) ? `${donation.quantity} units` : 'N/A';

  const formatRemaining = () => {
    if (!isValidExpiry) {
      return 'N/A';
    }

    const diffMs = expiryDate.getTime() - Date.now();
    if (diffMs <= 0) {
      return 'Expired';
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days}d ${remainingHours}h remaining`;
    }

    return `${hours}h remaining`;
  };

  const remainingText = formatRemaining();
  const requestButtonLabel = isAvailable
    ? 'Request This Donation'
    : uiStatus === 'requested'
    ? 'Request Submitted'
    : 'Request Closed';

  const iconClass = 'w-4 h-4 text-[#6b7280]';
  const expiryText = isValidExpiry
    ? expiryDate.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'N/A';

  const description =
    donation?.description ||
    `${donation?.foodName || 'Food donation'} ready for pickup`;

  return (
    <div className="bg-[#f8fafc] border border-[#d9dde3] rounded-2xl p-6 shadow-[0_2px_6px_rgba(15,23,42,0.06)] hover:shadow-[0_6px_14px_rgba(15,23,42,0.08)] transition">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-4xl font-bold leading-tight text-[#0f172a] md:text-[1.95rem]">
          {donation.foodName || 'Unnamed donation'}
        </h3>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            isAvailable
              ? 'bg-[#d9f4e4] text-[#1a8e52]'
              : uiStatus === 'requested'
              ? 'bg-[#fef3c7] text-[#a16207]'
              : 'bg-[#e5e7eb] text-[#4b5563]'
          }`}
        >
          {uiStatus}
        </span>
      </div>

      <p className="text-[#64748b] text-xl md:text-lg mb-4">{donorName}</p>
      <p className="text-[#1f2937] text-lg md:text-base leading-relaxed mb-5">{description}</p>

      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between text-lg md:text-[1rem]">
          <div className="inline-flex items-center gap-2 text-[#334155]">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
              <path d="M10 2 3 5.5v9L10 18l7-3.5v-9L10 2Z" />
              <path d="M10 2v7m0 0 7-3.5M10 9 3 5.5" />
            </svg>
            <span>{quantityLabel}</span>
          </div>
          <div className={remainingText === 'Expired' || isExpiring ? 'inline-flex items-center gap-2 text-[#f97316]' : 'inline-flex items-center gap-2 text-[#f59e0b]'}>
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
              <circle cx="10" cy="10" r="7" />
              <path d="M10 6v4l2.8 1.8" />
            </svg>
            <span>{isExpired ? 'Expired' : remainingText}</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-lg md:text-base text-[#475569]">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
            <path d="M10 17s5-4.7 5-8.5A5 5 0 1 0 5 8.5C5 12.3 10 17 10 17Z" />
            <circle cx="10" cy="8.5" r="1.7" />
          </svg>
          <span>{donation.pickupAddress || donation.location?.address || 'N/A'}</span>
        </div>

        <div className="inline-flex items-center gap-2 text-base md:text-[15px] text-[#64748b]">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
            <rect x="3" y="4" width="14" height="13" rx="2" />
            <path d="M6.5 2.8v2.4M13.5 2.8v2.4M3 8h14" />
          </svg>
          <span>Expires: {expiryText}</span>
        </div>
      </div>

      <button
        onClick={handleRequestClick}
        disabled={!isAvailable}
        className="w-full rounded-xl py-3 text-lg md:text-xl font-semibold transition bg-[#020326] text-white hover:bg-[#0f172a] disabled:bg-[#7d808c] disabled:cursor-not-allowed"
      >
        {requestButtonLabel}
      </button>
    </div>
  );
}
