import React, { useEffect, useState } from 'react';
import { donationAPI } from '../services/api';
import DonationCard from '../components/DonationCard';

const mapUiStatus = (status) => {
  const normalized = (status || 'available').toLowerCase();

  if (normalized === 'available') {
    return 'available';
  }

  if (normalized === 'requested' || normalized === 'pending') {
    return 'requested';
  }

  if (normalized === 'approved' || normalized === 'completed' || normalized === 'reserved' || normalized === 'collected') {
    return 'reserved';
  }

  return 'reserved';
};

const normalizeDonation = (donation) => ({
  ...donation,
  foodName: donation?.foodName || 'Unnamed donation',
  quantity: Number.isFinite(Number(donation?.quantity)) ? Number(donation.quantity) : 0,
  status: donation?.status || 'available',
  uiStatus: mapUiStatus(donation?.status),
  location: {
    ...donation?.location,
    address: donation?.pickupAddress || donation?.location?.address || 'N/A',
  },
  donor: donation?.donor || null,
});

export default function BrowseDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filteredDonations, setFilteredDonations] = useState([]);

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    const filtered = donations.filter(
      (donation) => {
        const matchesSearch =
          (donation.foodName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (donation.location?.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (donation?.donor?.organizationName || '').toLowerCase().includes(searchTerm.toLowerCase());

        const donationStatus = donation?.uiStatus || 'available';
        const matchesStatus = statusFilter === 'all' || donationStatus === statusFilter;

        const donationType = (donation?.foodName || '').split(' ')[0]?.toLowerCase() || 'other';
        const matchesType = typeFilter === 'all' || donationType === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
      }
    );
    setFilteredDonations(filtered);
  }, [searchTerm, statusFilter, typeFilter, donations]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = token ? await donationAPI.getAll() : await donationAPI.getPublicAll();

      if (response.data.success) {
        const normalizedDonations = (response.data.donations || []).map(normalizeDonation);
        setDonations(normalizedDonations);
        setFilteredDonations(normalizedDonations);
      }
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach API server. Make sure backend is running on http://localhost:5000');
      } else {
        setError(err.response?.data?.message || 'Failed to load donations');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#f6f7f9]">
        <div className="text-lg text-gray-600">Loading donations...</div>
      </div>
    );

  const statusOptions = ['all', 'available', 'requested', 'reserved'];
  const typeOptions = [
    'all',
    ...new Set(
      donations.map((d) => ((d.foodName || '').split(' ')[0] || 'other').toLowerCase())
    ),
  ];

  const availableCount = donations.filter((d) => (d.uiStatus || '').toLowerCase() === 'available').length;
  const pendingCount = donations.filter((d) => (d.uiStatus || '').toLowerCase() === 'requested').length;
  const approvedCount = donations.filter((d) => (d.uiStatus || '').toLowerCase() === 'reserved').length;

  return (
    <div className="min-h-screen bg-[#f4f6f8] px-4 py-6 md:px-6">
      <div className="max-w-[1180px] mx-auto">
        <h1 className="text-[2.4rem] font-bold text-[#0f172a] md:text-[2.8rem] mb-1">
          Available Donations
        </h1>
        <p className="text-lg text-[#64748b] md:text-2xl mb-8">
          Browse and request food donations from local restaurants
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="mb-6 bg-[#f1f3f5] border border-[#dee3e8] rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" aria-hidden="true">
                <svg viewBox="0 0 20 20" width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="9" cy="9" r="5.5" />
                  <path d="M13.2 13.2 17 17" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search donations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-[#d9dde2] rounded-xl bg-[#f7f8fa] text-sm focus:outline-none focus:ring-2 focus:ring-[#cbd5e1]"
              />
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" aria-hidden="true">
                <svg viewBox="0 0 20 20" width="20" height="20" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 5h14l-5.5 6.2v4.1l-3 1.6v-5.7L3 5Z" />
                </svg>
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 pl-11 py-3 border border-[#d9dde2] rounded-xl bg-[#f7f8fa] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#cbd5e1]"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : `${status.charAt(0).toUpperCase()}${status.slice(1)}`}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-3 border border-[#d9dde2] rounded-xl bg-[#f7f8fa] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#cbd5e1]"
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : `${type.charAt(0).toUpperCase()}${type.slice(1)}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-[#b8e8c8] bg-[#e8f5ec] p-5">
            <p className="text-5xl font-semibold leading-none text-[#0f172a]">{availableCount}</p>
            <p className="mt-2 text-[#475569] text-[15px]">Available Donations</p>
          </div>

          <div className="rounded-2xl border border-[#e7da9d] bg-[#f6f1db] p-5">
            <p className="text-5xl font-semibold leading-none text-[#0f172a]">{pendingCount}</p>
            <p className="mt-2 text-[#475569] text-[15px]">Pending Requests</p>
          </div>

          <div className="rounded-2xl border border-[#bbd4f2] bg-[#e7eef8] p-5">
            <p className="text-5xl font-semibold leading-none text-[#0f172a]">{approvedCount}</p>
            <p className="mt-2 text-[#475569] text-[15px]">Approved Requests</p>
          </div>
        </div>

        {filteredDonations.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-[#e5e7eb]">
            <p className="text-gray-500 text-xl">
              {searchTerm ? 'No donations match your search' : 'No donations available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDonations.map((donation) => (
              <DonationCard key={donation._id} donation={donation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
