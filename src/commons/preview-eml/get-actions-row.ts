/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import { MailMessage } from '../../types';
import { getAttachmentsDownloadLink } from '../../views/app/detail-panel/preview/utils';

export const getActionsRow = ({ msg }: { msg: MailMessage }): string => `
<tr>
   <td style="
      width: auto;
      padding: 0.1875rem 0 0.1875rem 0;
      vertical-align: top;
      text-align: left;
      white-space: nowrap;
      ">
      <p style="
      font-weight: 400;
      color: #828282;
">${t('label.attachment_with_count', {
	count: msg.attachments?.length,
	defaultValue: '{{count}} Attachment',
	defaultValue_plural: '{{count}} Attachments'
})}<span style="padding: 0.1875rem 0.1875rem 0.1875rem 0.1875rem; vertical-align: top; overflow: hidden; color: #828282;font-family: Roboto, sans-serif;
         font-style: normal;
         font-weight: 400;
         line-height: 1.3125rem;">
         <a href=${getAttachmentsDownloadLink({
						messageId: msg.id,
						messageSubject: encodeURIComponent(msg.subject),
						attachments: map(msg.attachments, 'name')
					})}>${t('label.download', {
	count: msg.attachments?.length,
	defaultValue: 'Download',
	defaultValue_plural: 'Download all'
})}</a>
	</span>
            </p>
   </td>
</tr>
`;
