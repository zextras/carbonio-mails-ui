/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { find, map } from 'lodash';
import { DefaultTheme } from 'styled-components';
import { MailMessage } from '../../types';
import { humanFileSize } from '../../views/app/detail-panel/preview/file-preview';
import { getAttachmentIconColors } from '../../views/app/detail-panel/preview/utils';
import { getFileExtension } from '../utilities';

export const getAttachments = ({ msg, theme }: { msg: MailMessage; theme: DefaultTheme }): string =>
	`
<tr>
   <td style="
      margin: 1rem 0;
      display: flex;
      ">
${map(
	msg.attachments,
	(item) => `
   <div style="
      width: 16.5rem;
      margin-right: 0.5rem;
      height: 3.25rem;
      background-color: #F5F6F8;
      cursor: pointer;
      border-radius: 0.125rem;
      display: flex;
      flex-direction: row;
      "
      onclick=window.location="/service/home/~/?auth=co&id=${msg.id}&part=${item.part}">
         <div style="
                  display: flex;
                  font-size: 0.75rem;
                  width: 2rem;
                  height: 2rem;
                  border-radius: 0.25rem;
                  margin: 0.5rem;
                  justify-content: center;
                  align-items: center;
                  color: #FFFFFF;        
                  background-color: ${
										find(
											getAttachmentIconColors({ attachments: msg.attachments ?? [], theme }),
											(ic) => ic.extension === getFileExtension(item).value
										)?.color ?? '#F5F6F8'
									}
         "><p style="
                  line-height: 2rem;
                  margin-top: 1rem;
            ">
         ${
						getFileExtension(item).displayName?.toUpperCase() ??
						getFileExtension(item).value.toUpperCase()
					}
         </p>
         </div>
         <div style="
                  display: flex;
                  font-size: 0.75rem;
                  flex-direction: column;
                  width: calc(100% - 4rem);
                  line-height: 1.125rem;
                  "
         >
            <div style="
            color: #000000;
            white-space: nowrap;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-top: 0.5rem;
            "
            >
            ${item.filename}
            </div>
            <div style="
            color: #828282;
            width: fit-content;
            "
            >
            ${humanFileSize(item.size ?? 0)}
            </div>
         </div>

      </div>`
).join('')}
</td>
</tr>
`;
