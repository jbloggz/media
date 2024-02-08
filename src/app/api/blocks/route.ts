/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * The route to download the block info
 */

export async function GET() {
   const apiResp: APIBlocks = {
      blockSize: 60,
      blocks: [
         { heading: 'November 2023', count: 28, total: 0 },
         { heading: 'October 2023', count: 100, total: 0 },
         { heading: 'September 2023', count: 100, total: 0 },
         { heading: 'August 2023', count: 69, total: 0 },
         { heading: 'July 2023', count: 130, total: 0 },
         { heading: 'June 2023', count: 28, total: 0 },
         { heading: 'May 2023', count: 47, total: 0 },
         { heading: 'April 2023', count: 28, total: 0 },
         { heading: 'March 2023', count: 76, total: 0 },
         { heading: 'February 2023', count: 34, total: 0 },
         { heading: 'January 2023', count: 12, total: 0 },
         { heading: 'December 2022', count: 22, total: 0 },
         { heading: 'November 2022', count: 12, total: 0 },
         { heading: 'October 2022', count: 1, total: 0 },
         { heading: 'September 2022', count: 23, total: 0 },
         { heading: 'August 2022', count: 34, total: 0 },
         { heading: 'July 2022', count: 45, total: 0 },
         { heading: 'June 2022', count: 56, total: 0 },
         { heading: 'May 2022', count: 54, total: 0 },
         { heading: 'April 2022', count: 76, total: 0 },
         { heading: 'March 2022', count: 87, total: 0 },
         { heading: 'February 2022', count: 54, total: 0 },
         { heading: 'January 2022', count: 32, total: 0 },
         { heading: 'December 2021', count: 43, total: 0 },
         { heading: 'November 2021', count: 65, total: 0 },
         { heading: 'October 2021', count: 87, total: 0 },
         { heading: 'September 2021', count: 432, total: 0 },
         { heading: 'August 2021', count: 1, total: 0 },
         { heading: 'July 2021', count: 23, total: 0 },
         { heading: 'June 2021', count: 43, total: 0 },
         { heading: 'May 2021', count: 5, total: 0 },
         { heading: 'April 2021', count: 89, total: 0 },
         { heading: 'March 2021', count: 34, total: 0 },
         { heading: 'February 2021', count: 67, total: 0 },
         { heading: 'January 2021', count: 89, total: 0 },
         { heading: 'December 2020', count: 34, total: 0 },
         { heading: 'November 2020', count: 23, total: 0 },
         { heading: 'October 2020', count: 56, total: 0 },
         { heading: 'September 2020', count: 78, total: 0 },
         { heading: 'August 2020', count: 23, total: 0 },
         { heading: 'July 2020', count: 12, total: 0 },
         { heading: 'June 2020', count: 456, total: 0 },
         { heading: 'May 2020', count: 3, total: 0 },
         { heading: 'April 2020', count: 21, total: 0 },
         { heading: 'March 2020', count: 23, total: 0 },
         { heading: 'February 2020', count: 45, total: 0 },
         { heading: 'January 2020', count: 34, total: 0 },
         { heading: 'December 2019', count: 67, total: 0 },
         { heading: 'November 2019', count: 345, total: 0 },
         { heading: 'October 2019', count: 21, total: 0 },
         { heading: 'September 2019', count: 11, total: 0 },
         { heading: 'August 2019', count: 8, total: 0 },
         { heading: 'July 2019', count: 45, total: 0 },
         { heading: 'June 2019', count: 34, total: 0 },
         { heading: 'May 2019', count: 23, total: 0 },
         { heading: 'April 2019', count: 34, total: 0 },
         { heading: 'March 2019', count: 56, total: 0 },
         { heading: 'February 2019', count: 4, total: 0 },
         { heading: 'January 2019', count: 34, total: 0 },
         { heading: 'December 2018', count: 98, total: 0 },
      ],
   };

   let cumulative = 0;
   for (const block of apiResp.blocks) {
      cumulative += block.count;
      block.total = cumulative;
   }

   return Response.json(apiResp);
}
