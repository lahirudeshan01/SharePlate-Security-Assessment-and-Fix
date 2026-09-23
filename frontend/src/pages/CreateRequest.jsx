import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { donationAPI, requestAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CreateRequest() {
  const { donationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [donation, setDonation] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchDonation();
  }, [donationId, user, navigate]);

  const fetchDonation = async () => {
    try {
      const response = await donationAPI.getById(donationId);
      setDonation(response.data.donation);
    } catch (err) {
      setError('Donation not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const response = await requestAPI.createRequest({
        donationId,
        requestedQuantity: parseInt(quantity, 10),
        foodName: donation.foodName,
        message: notes,
      });

      if (response.data.success) {
        alert('Request submitted successfully!');
        navigate('/manage-requests');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-2xl">{error}</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6">Request Food Donation</h1>

        {donation && (
          <>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg mb-6">
              <h2 className="text-2xl font-bold text-blue-900">{donation.foodName}</h2>
              <p className="text-gray-700 mt-2">
                <strong>Available:</strong> {donation.quantity} units
              </p>
              <p className="text-gray-700">
                <strong>Location:</strong> {donation.pickupAddress || donation.location?.address || 'N/A'}
              </p>
              <p className="text-gray-700">
                <strong>From:</strong> {donation.donor?.organizationName || donation.donor?.name || 'Unknown'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">
                  Quantity Needed <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={donation.quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maximum available: {donation.quantity} units
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  rows="4"
                  placeholder="Any special requirements or information..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex-1 bg-gray-400 text-white py-3 rounded-lg hover:bg-gray-500 transition font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
