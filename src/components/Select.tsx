/**
 * MIT License
 *
 * Author: Josef Barnes
 *
 * A wrapper around rect-select for custom behaviour
 */
'use client';

import { useState } from 'react';
import ReactSelect, { GroupBase, Props } from 'react-select';

export const Select = <Option, IsMulti extends boolean = false, Group extends GroupBase<Option> = GroupBase<Option>>(
   props: Props<Option, IsMulti, Group>
) => {
   const [menuIsOpen, setMenuIsOpen] = useState(false);

   return (
      <div className="relative">
         <ReactSelect
            onFocus={() => setMenuIsOpen(true)}
            onBlur={() => setMenuIsOpen(false)}
            menuIsOpen={menuIsOpen}
            className="react-select-container"
            classNamePrefix="react-select"
            {...props}
         />
         <div role='button' className="opacity-0 h-12 w-9 absolute top-0 right-px hover:cursor-pointer" onClick={() => setMenuIsOpen(!menuIsOpen)}></div>
      </div>
   );
};
