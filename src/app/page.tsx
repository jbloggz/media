/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * The home page where all the photos can be browsed
 */

const Home = () => {
   return (
      <main className="container p-1 mx-auto overflow-y-scroll flex-1 no-scrollbar">
         <h1 className="text-xl font-bold p-2">November 2023</h1>
         <div className="pb-8 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-1">
            {Array.from(Array(7)).map((_, i) => (
               <div key={i} className="w-full aspect-square">
                  <div className="skeleton w-full h-full cursor-pointer"></div>
               </div>
            ))}
         </div>

         <h1 className="text-xl font-bold p-2">September 2023</h1>
         <div className="pb-8 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-1">
            {Array.from(Array(17)).map((_, i) => (
               <div key={i} className="w-full aspect-square">
                  <div className="skeleton w-full h-full cursor-pointer"></div>
               </div>
            ))}
         </div>

         <h1 className="text-xl font-bold p-2">December 2022</h1>
         <div className="pb-8 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-1">
            {Array.from(Array(13)).map((_, i) => (
               <div key={i} className="w-full aspect-square">
                  <div className="skeleton w-full h-full cursor-pointer"></div>
               </div>
            ))}
         </div>

         <h1 className="text-xl font-bold p-2">June 2022</h1>
         <div className="pb-8 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-1">
            {Array.from(Array(2)).map((_, i) => (
               <div key={i} className="w-full aspect-square">
                  <div className="skeleton w-full h-full cursor-pointer"></div>
               </div>
            ))}
         </div>

         <h1 className="text-xl font-bold p-2">January 2022</h1>
         <div className="pb-8 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-1">
            {Array.from(Array(8)).map((_, i) => (
               <div key={i} className="w-full aspect-square">
                  <div className="skeleton w-full h-full cursor-pointer"></div>
               </div>
            ))}
         </div>
      </main>
   );
};

export default Home;
