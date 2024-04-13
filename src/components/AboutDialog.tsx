/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * The About Dialog
 */
'use client';

import moment from 'moment-timezone';
import { useAPI } from '@/hooks';

interface AboutDialogProps {
   show: boolean;
   onClose: () => void;
}

export const AboutDialog = (props: AboutDialogProps) => {
   const version = useAPI<Version>({ url: '/api/version' });

   return (
      <dialog className="modal" open={props.show}>
         <div className="modal-box flex flex-col w-full h-full max-h-full max-w-full md:max-w-2xl md:max-h-[750px]">
            <h1 className="text-xl font-bold">About</h1>

            <h1 className="text-lg font-bold mt-5">Version</h1>
            <p className="pl-3">
               {version.data ? (
                  <>
                     {version.data.version}
                     {version.data.version.includes('-') && <> ({moment(new Date(version.data.timestamp * 1000)).format('YYYY-MM-DD')})</>}
                  </>
               ) : (
                  <>Unknown</>
               )}
            </p>

            <h2 className="text-lg font-bold mt-3">MIT License</h2>

            <div className="container space-y-3 flex flex-col pl-3">
               <p>Copyright (c) 2024 Josef Barnes</p>

               <p>
                  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
                  (the &ldquo;Software&rdquo;), to deal in the Software without restriction, including without limitation the rights to use, copy,
                  modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
                  furnished to do so, subject to the following conditions:
               </p>

               <p>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</p>

               <p>
                  THE SOFTWARE IS PROVIDED &ldquo;AS IS&rdquo;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
                  WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
                  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
                  OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
               </p>
            </div>
            <div className="modal-action">
               <button className="btn" onClick={props.onClose}>
                  Close
               </button>
            </div>
         </div>
      </dialog>
   );
};
