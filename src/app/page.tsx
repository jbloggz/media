/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * The home page where all the photos can be browsed
 */

import { Gallery } from "@/components";
import { GET as getBlocks } from "@/app/api/blocks/route";

const Home = async () => {
   const resp = await getBlocks()
   if (!resp.ok) {
      throw new Error('Failed to fetch blocks')
   }

   const data = await resp.json()

   return (
      <Gallery blockSize={data.blockSize} blocks={data.blocks} />
   );
};

export default Home;
