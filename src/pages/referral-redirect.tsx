/**
 * Referral Redirect Page
 * Captures sponsor ID from /ref/:referralId URL and redirects to signup
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const SPONSOR_STORAGE_KEY = 'wellnexus_sponsor_id';

export default function ReferralRedirect() {
    const { referralId } = useParams<{ referralId: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        if (referralId) {
            sessionStorage.setItem(SPONSOR_STORAGE_KEY, referralId);
        }
        navigate('/signup', { replace: true });
    }, [referralId, navigate]);

    return null;
}
