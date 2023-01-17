/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const getBodyWrapper = ({
	content,
	subject
}: {
	content: string;
	subject: string;
}): string => {
	const style = `background: white;font-family: Roboto, sans-serif;font-style: normal; font-weight: 400;  font-size: 1.125rem;
    line-height: 1.6875rem;`;

	return `
    <div class="ZhCallListPrintView">
        <div>
            <div class="ZhPrintSubject"
                style="${style} height: 1.75rem;padding-left: 0.25rem;display: flex;align-items: center;">
                <b>${subject}</b>
            </div>
            <div>
                ${content}
            </div>
        </div>
    </div>
    `;
};
