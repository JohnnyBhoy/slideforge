import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';

const OAuthSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token).then(() => {
        navigate('/', { replace: true });
      }).catch(() => {
        toast.error('Authentication failed. Please try again.');
        navigate('/', { replace: true });
      });
    } else {
      toast.error('Authentication failed. Please try again.');
      navigate('/', { replace: true });
    }
  }, []);

  return <Loader fullPage text="Signing you in..." />;
};

export default OAuthSuccess;
