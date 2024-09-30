/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { HtmlMessageRenderer } from './html-message-renderer';
import { setupTest } from '../../carbonio-ui-commons/test/test-setup';
import { BodyPart } from '../../types';

describe('HTML message renderer', () => {
	describe('Message too large banner', () => {
		it('should display banner if body truncated', async () => {
			const body: BodyPart = {
				content: 'This content is trunc',
				contentType: 'text/html',
				truncated: true
			};

			setupTest(<HtmlMessageRenderer msgId={'1'} body={body} parts={[]} participants={[]} />);

			expect(await screen.findByText('warningBanner.truncatedMessage.label')).toBeVisible();
		});
		it('should not display banner if body not truncated', async () => {
			const body: BodyPart = {
				content: 'This content is not truncated',
				contentType: 'text/html',
				truncated: false
			};

			setupTest(<HtmlMessageRenderer msgId={'1'} body={body} parts={[]} participants={[]} />);

			expect(screen.queryByText('warningBanner.truncatedMessage.label')).not.toBeInTheDocument();
		});
	});
});
