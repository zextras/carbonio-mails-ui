/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const getSubject = (content: string, subject: string): string => `<tr>
    <td style="
       width: auto;
       padding: 0.1875rem 0 0.1875rem 0;
       vertical-align: top;
       text-align: left;
       font-weight: bold;
       ">${subject}: <span style="padding: 0.1875rem 0.1875rem 0.1875rem 0.1875rem; vertical-align: top; overflow: hidden;font-family: Roboto, sans-serif;
       font-style: normal;
       font-weight: 400;
       font-size: 0.875rem;
       line-height: 1.3125rem;">${content}</span></td>
    </tr>`;
