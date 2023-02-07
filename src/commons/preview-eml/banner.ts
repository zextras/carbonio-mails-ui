/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t } from '@zextras/carbonio-shell-ui';

export const banner = `
<td style="
   width: auto;
   padding: 0 1rem;
   vertical-align: top;
   text-align: left;
   font-weight: 400;
   white-space: nowrap;
   font-family: Roboto, sans-serif;
   background-color: #E6E9ED;
   border-radius: 0.125rem 0.125rem 0 0;
   border-bottom: 1px solid #333333;
   display: flex;
   height: 3.5rem;
   ">
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 22 22" style="
      width: 1.25rem;
      fill: #333333;
      ">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
      <circle cx="12" cy="8" r="1" />
      <path d="M12 10a1 1 0 0 0-1 1v5a1 1 0 0 0 2 0v-5a1 1 0 0 0-1-1z" />
   </svg>
   <p style="
      padding: 0 0 0 1rem;
      line-height: 3.5rem;
      margin: 0;
      ">
      ${t(
				'label.attachments_disclaimer',
				'You are viewing an attached message. The authenticity of the attached messages can not be verified.'
			)}
   </p>
</td>
`;
