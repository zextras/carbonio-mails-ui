/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function getBodyWrapper({ content, subject }: { content: string; subject: string }): string {
	return `
        <div className="ZhCallListPrintView">
			<table cellPadding="0" cellSpacing="5" width="100%">
				<tr>
					<td>
						<div className="ZhPrintSubject" 
                        style="padding-left: 0.25rem;
                        display: flex;
                        align-items: center;">
							<b>${subject}</b>
						</div>
						<hr />
					</td>
				</tr>
				<tr>
					<td>${content}</td>
				</tr>
			</table>
		</div>`;
}
