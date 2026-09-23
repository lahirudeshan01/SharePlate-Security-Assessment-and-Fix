import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestAPI, donationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DonationCard from '../components/DonationCard';
import donationService from '../services/donationService';

const mapUiStatus = (status) => {
  const normalized = (status || 'available').toLowerCase();
  if (normalized === 'available') return 'available';
  if (normalized === 'requested' || normalized === 'pending') return 'requested';
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

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For shelter: 'browse' | 'pending' | 'approved' | 'rejected'
  // For donor: 'pending' | 'approved' | 'rejected'
  const [activeTab, setActiveTab] = useState(user?.role === 'shelter' ? 'browse' : 'my-donations');

  // Browse donations state (shelter only)
  const [donations, setDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredDonations, setFilteredDonations] = useState([]);

  // My donations state (donor only)
  const [myDonations, setMyDonations] = useState([]);
  const [myDonationsLoading, setMyDonationsLoading] = useState(false);

  useEffect(() => {
    fetchData();
    if (user?.role === 'shelter') {
      fetchDonations();
    }
    if (user?.role === 'donor' || user?.role === 'restaurant') {
      fetchMyDonations();
    }
  }, [user]);

  const fetchMyDonations = async () => {
    try {
      setMyDonationsLoading(true);
      const res = await donationService.getMyDonations();
      setMyDonations(res.donations || []);
    } catch {
      // silent
    } finally {
      setMyDonationsLoading(false);
    }
  };

  const handleDeleteDonation = async (donationId) => {
    if (!window.confirm('Are you sure you want to delete this donation?')) return;
    try {
      await donationService.delete(donationId);
      fetchMyDonations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete donation');
    }
  };

  useEffect(() => {
    const filtered = donations.filter((d) => {
      const matchesSearch =
        (d.foodName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.location?.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d?.donor?.organizationName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const donationStatus = d?.uiStatus || 'available';
      const matchesStatus = statusFilter === 'all' || donationStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
    setFilteredDonations(filtered);
  }, [searchTerm, statusFilter, donations]);

  const fetchDonations = async () => {
    try {
      setDonationsLoading(true);
      const response = await donationAPI.getAll();
      if (response.data.success) {
        const normalized = (response.data.donations || []).map(normalizeDonation);
        setDonations(normalized);
        setFilteredDonations(normalized);
      }
    } catch (err) {
      // silent — donations section will show empty
    } finally {
      setDonationsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (user?.role === 'shelter') {
        const res = await requestAPI.getMyRequests();
        const myRequests = res.data.requests || [];
        if (myRequests.length === 0) {
          const allRes = await requestAPI.getAllRequests();
          setRequests(allRes.data.requests || []);
        } else {
          setRequests(myRequests);
        }
      } else if (user?.role === 'donor' || user?.role === 'restaurant') {
        const res = await requestAPI.getDonorRequests();
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await requestAPI.approveRequest(requestId);
      alert('Request approved successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await requestAPI.rejectRequest(requestId);
      alert('Request rejected!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      await requestAPI.deleteRequest(requestId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete request');
    }
  };

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );

  const pendingRequests = requests.filter((req) => req.status === 'pending');
  const approvedRequests = requests.filter((req) => req.status === 'approved');
  const rejectedRequests = requests.filter((req) => req.status === 'rejected');

  const groupedRequests = { pending: pendingRequests, approved: approvedRequests, rejected: rejectedRequests };
  const tabRequests = groupedRequests[activeTab] || [];

  const statusBadgeClasses = {
    pending: 'bg-[#fff2c9] text-[#b7791f] border border-[#f4df93]',
    approved: 'bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]',
    rejected: 'bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]',
  };

  const isShelter = user?.role === 'shelter';
  const isDonor = user?.role === 'donor' || user?.role === 'restaurant';

  const availableCount = donations.filter((d) => d.uiStatus === 'available').length;

  // Tab definitions
  const shelterTabs = [
    { key: 'browse', label: `Browse Donations (${availableCount})` },
    { key: 'pending', label: `Pending (${pendingRequests.length})` },
    { key: 'approved', label: `Approved (${approvedRequests.length})` },
    { key: 'rejected', label: `Rejected (${rejectedRequests.length})` },
  ];

  const donorTabs = [
    { key: 'my-donations', label: `My Donations (${myDonations.length})` },
    { key: 'pending', label: `Pending (${pendingRequests.length})` },
    { key: 'approved', label: `Approved (${approvedRequests.length})` },
    { key: 'rejected', label: `Rejected (${rejectedRequests.length})` },
  ];

  const tabs = isShelter ? shelterTabs : donorTabs;

  return (
    <div className="min-h-screen bg-[#f4f6f8] px-4 py-6 md:px-6">
      <div className="max-w-[1180px] mx-auto">

        {/* ── User Profile Card ── */}
        <div className="bg-white rounded-2xl border border-[#d9dde3] p-6 mb-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#0ea55b] flex items-center justify-center text-white text-2xl font-bold">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#0f172a]">{user?.name || 'User'}</h2>
              <p className="text-[#64748b] text-base">{user?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize bg-[#e6f5ec] text-[#1b9d59] border border-[#b8e8c8]">
                  {(user?.role === 'donor' || user?.role === 'restaurant') ? 'Restaurant' : user?.role === 'shelter' ? 'Shelter / NGO' : user?.role === 'manager' ? 'Manager' : user?.role === 'admin' ? 'Admin' : user?.role || 'Unknown'}
                </span>
                {user?.organizationName && (
                  <span className="text-sm text-[#475569]">{user.organizationName}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[2.4rem] font-bold text-[#0f172a] mb-1">
              {isShelter ? 'Shelter Dashboard' : 'Manage Requests'}
            </h1>
            <p className="text-lg text-[#64748b]">
              {isShelter
                ? 'Browse available donations and track your requests'
                : 'Review and approve food requests from shelters'}
            </p>
          </div>
          {isDonor && (
            <button
              onClick={() => navigate('/create-donation')}
              className="flex items-center gap-2 bg-[#0ea55b] hover:bg-[#0c9151] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
            >
              <svg viewBox="0 0 20 20" width="16" height="16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 4v12M4 10h12" />
              </svg>
              Create Donation
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-[#e7da9d] bg-[#f6f1db] p-5">
            <p className="text-5xl font-semibold leading-none text-[#0f172a]">{pendingRequests.length}</p>
            <p className="mt-2 text-[#475569] text-[15px]">Pending Requests</p>
          </div>
          <div className="rounded-2xl border border-[#b8e8c8] bg-[#e8f5ec] p-5">
            <p className="text-5xl font-semibold leading-none text-[#0f172a]">{approvedRequests.length}</p>
            <p className="mt-2 text-[#475569] text-[15px]">Approved Requests</p>
          </div>
          <div className="rounded-2xl border border-[#d6dde6] bg-[#eff2f6] p-5">
            <p className="text-5xl font-semibold leading-none text-[#0f172a]">{rejectedRequests.length}</p>
            <p className="mt-2 text-[#475569] text-[15px]">Rejected Requests</p>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className={`bg-[#e4e7ec] rounded-2xl p-1.5 grid gap-2 mb-6`} style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-xl py-2.5 text-sm font-semibold transition ${
                activeTab === tab.key ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#334155]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── My Donations Tab (Donor Only) ── */}
        {activeTab === 'my-donations' && isDonor && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => navigate('/create-donation')}
                className="flex items-center gap-2 bg-[#0ea55b] hover:bg-[#0c9151] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
              >
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 4v12M4 10h12" />
                </svg>
                New Donation
              </button>
            </div>

            {myDonationsLoading ? (
              <div className="text-center py-10 text-gray-500">Loading donations...</div>
            ) : myDonations.length === 0 ? (
              <div className="text-center py-14 bg-white rounded-2xl border border-[#e5e7eb]">
                <p className="text-gray-500 text-xl mb-3">You haven't posted any donations yet.</p>
                <button
                  onClick={() => navigate('/create-donation')}
                  className="bg-[#0ea55b] hover:bg-[#0c9151] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
                >
                  Create Your First Donation
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myDonations.map((donation) => {
                  const isExpired = new Date(donation.expiryDate) < new Date();
                  const statusColors = {
                    available: 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]',
                    reserved: 'bg-[#fff2c9] text-[#b7791f] border-[#f4df93]',
                    collected: 'bg-[#dbeafe] text-[#1d4ed8] border-[#bfdbfe]',
                    expired: 'bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]',
                  };
                  const displayStatus = isExpired && donation.status === 'available' ? 'expired' : donation.status;
                  const badgeClass = statusColors[displayStatus] || 'bg-gray-100 text-gray-600 border-gray-200';

                  return (
                    <div key={donation._id} className="bg-white rounded-2xl border border-[#d9dde3] shadow-[0_2px_8px_rgba(15,23,42,0.04)] p-5 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-[#0f172a] leading-tight">{donation.foodName}</h3>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border capitalize ${badgeClass}`}>
                          {displayStatus}
                        </span>
                      </div>

                      {donation.description && (
                        <p className="text-sm text-[#64748b] line-clamp-2">{donation.description}</p>
                      )}

                      <div className="text-sm text-[#334155] space-y-1">
                        <div>Quantity: <span className="font-semibold">{donation.quantity}</span></div>
                        <div>Expires: <span className={isExpired ? 'text-red-600 font-semibold' : ''}>{new Date(donation.expiryDate).toLocaleDateString()}</span></div>
                        {donation.pickupAddress && <div className="truncate" title={donation.pickupAddress}>📍 {donation.pickupAddress}</div>}
                      </div>

                      <div className="flex gap-2 mt-auto pt-2 border-t border-[#f1f5f9]">
                        <button
                          onClick={() => navigate(`/donations/${donation._id}/edit`)}
                          disabled={donation.status !== 'available'}
                          className="flex-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] disabled:opacity-40 disabled:cursor-not-allowed text-[#334155] py-2 rounded-xl text-sm font-semibold transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDonation(donation._id)}
                          className="flex-1 bg-[#fee2e2] hover:bg-[#fecaca] text-[#b91c1c] py-2 rounded-xl text-sm font-semibold transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Browse Donations Tab (Shelter Only) ── */}
        {activeTab === 'browse' && isShelter && (
          <div className="space-y-6">
            {/* Search bar */}
            <div className="bg-[#f1f3f5] border border-[#dee3e8] rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3">
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
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-[#d9dde2] rounded-xl bg-[#f7f8fa] text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#cbd5e1]"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="requested">Requested</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>
            </div>

            {donationsLoading ? (
              <div className="text-center py-10 text-gray-500">Loading donations...</div>
            ) : filteredDonations.length === 0 ? (
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
        )}

        {/* ── Request Lists (Pending / Approved / Rejected) ── */}
        {activeTab !== 'browse' && activeTab !== 'my-donations' && (
          <>
            {tabRequests.length === 0 ? (
              <div className="rounded-2xl border border-[#e2e8f0] bg-white p-8 text-center text-[#64748b]">
                {activeTab === 'pending' ? 'No pending requests' : activeTab === 'approved' ? 'No approved requests' : 'No rejected requests'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 justify-items-start">
                {tabRequests.map((req) => {
                  const donorName = req?.donation?.donor?.organizationName || req?.donation?.donor?.name || 'Unknown donor';
                  const shelterName = req?.shelter?.organizationName || req?.shelter?.name || 'Unknown shelter';
                  const quantity = req.requestedQuantity ?? req.quantityRequested ?? 'N/A';
                  const donationDescription = req?.donation?.description || `${req?.foodName || req?.donation?.foodName || 'Donation'} request`;
                  const canDeleteRequest = isShelter && req.status === 'pending';

                  return (
                    <div key={req._id} className="w-full max-w-[620px] bg-white p-6 rounded-2xl border border-[#d9dde3] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-[1.95rem] font-bold text-[#0f172a] leading-tight">
                          {req?.donation?.foodName || req.foodName || 'Donation'}
                        </h3>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClasses[req.status] || statusBadgeClasses.pending}`}>
                          {req.status}
                        </span>
                      </div>

                      <p className="text-[#64748b] text-lg mb-4">
                        {isShelter ? `Donor: ${donorName}` : `Requested by: ${shelterName}`}
                      </p>

                      {req.status === 'pending' && (
                        <div className="mb-4 flex gap-3">
                          {isDonor && (
                            <>
                              <button
                                onClick={() => handleApprove(req._id)}
                                className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition text-sm font-semibold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(req._id)}
                                className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition text-sm font-semibold"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {canDeleteRequest && (
                            <button
                              onClick={() => handleDeleteRequest(req._id)}
                              className="bg-[#dc2626] text-white px-4 py-2 rounded-xl hover:bg-[#b91c1c] transition text-sm font-semibold"
                            >
                              Delete Request
                            </button>
                          )}
                        </div>
                      )}

                      <div className="bg-[#f8fafc] border border-[#edf2f7] rounded-xl px-4 py-3 mb-3 text-base text-[#1f2937]">
                        {donationDescription}
                      </div>

                      {req.message && (
                        <div className="mb-4 border-l-4 border-[#3b82f6] pl-3 text-[#475569] italic">
                          "{req.message}"
                        </div>
                      )}

                      <div className="space-y-3 text-[#334155] mb-5">
                        <div className="flex flex-wrap items-center gap-6 text-base">
                          <span>Qty: {quantity}</span>
                          <span>Expires: {formatDate(req?.donation?.expiryDate)}</span>
                        </div>
                        <div className="text-base">{req?.donation?.pickupAddress || req?.donation?.location?.address || 'N/A'}</div>
                        <div className="text-sm text-[#64748b]">
                          Requested: {formatDateTime(req.createdAt)}
                          {isShelter ? '' : ` • Donor: ${donorName}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}