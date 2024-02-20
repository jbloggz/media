/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The error component
 */
'use client';

import { useEffect } from 'react';
import { toast } from 'react-toastify';

interface ErrorProps {
   error: Error & { digest?: string };
   reset: () => void;
}

const Error = (props: ErrorProps) => {
   useEffect(() => {
      toast.error(props.error.message, { toastId: 'next-error' });
   }, [props.error.message]);
   return null;
};

export default Error;
