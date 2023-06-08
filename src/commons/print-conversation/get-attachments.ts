/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import type { MailMessage } from '../../types';

export const getAttachments = ({ msg }: { msg: MailMessage }): string =>
	`
	<tr
   style="
   display: flow-root;
   margin-bottom: 1rem"
   >
   <td style="
      margin: 0.5rem;
      display: flex;
      ">
      <div style="
         color: #828282;
         display: flex;
         font-family: Roboto, sans-serif;
         font-size: 1rem;
         width: fill-content">
         ${t('label.attachment_plural', 'Attachments')}:
      </div>
   </td>
   ${map(
			msg.attachments,
			(item) => `
   <td style="
      color: #000000;
      white-space: nowrap;
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      "
      >
      <div style="
         display: flex;
         ">
         <svg 
            style="
            width: 0.75rem;
            display: flex;
            fill: #333333;
            margin: 0 0.375rem 0 0.5rem;
            " 
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
               d="M9.29 21a6.23 6.23 0 0 1-4.43-1.88 6 6 0 0 1-.22-8.49L12 3.2A4.11 4.11 0 0 1 15 2a4.48 4.48 0 0 1 3.19 1.35 4.36 4.36 0 0 1 .15 6.13l-7.4 7.43a2.54 2.54 0 0 1-1.81.75 2.72 2.72 0 0 1-1.95-.82 2.68 2.68 0 0 1-.08-3.77l6.83-6.86a1 1 0 0 1 1.37 1.41l-6.83 6.86a.68.68 0 0 0 .08.95.78.78 0 0 0 .53.23.56.56 0 0 0 .4-.16l7.39-7.43a2.36 2.36 0 0 0-.15-3.31 2.38 2.38 0 0 0-3.27-.15L6.06 12a4 4 0 0 0 .22 5.67 4.22 4.22 0 0 0 3 1.29 3.67 3.67 0 0 0 2.61-1.06l7.39-7.43a1 1 0 1 1 1.42 1.41l-7.39 7.43A5.65 5.65 0 0 1 9.29 21z"
               data-name="attach"
               />
         </svg>
         <p style="
            font-family: Roboto, sans-serif;
            font-size: 0.75rem;
            display: flex;
            line-height: 0;
            ">
            ${item.filename}
         </p>
      </div>
   </td>
   `
		).join('')}
   </td>
</tr>
`;
