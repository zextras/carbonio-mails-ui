/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import React from 'react';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { getMsg } from '../../../../../store/actions';
import { selectMessage } from '../../../../../store/messages-slice';
import { generateStore } from '../../../../../tests/generators/store';
import MailPreview from '../mail-preview';

/**
 * Test the Mail Preview component in different scenarios
 */
describe('Mail preview', () => {
	test.each`
		msgId   | attachmentType
		${'10'} | ${'3 inline images'}
		${'11'} | ${'a table with a link'}
		${'12'} | ${'a table with width greater than the previewer width'}
	`(`$attachmentType attachments are visible in email editor`, async ({ msgId }) => {
		// Generate the store
		const store = generateStore();

		// Invoke the fetch of the message and the store update
		await store.dispatch<any>(getMsg({ msgId }));
		const state = store.getState();
		const message = selectMessage(state, msgId);
		const props = {
			message,
			expanded: true,
			isAlone: true,
			isMessageView: true
		};

		// Render the component
		setupTest(<MailPreview {...props} />, { store });
		const iframe: HTMLIFrameElement = await screen.findByTestId('message-renderer-iframe');
		const iframeContent = iframe?.contentWindow?.document.body.innerHTML.toString();

		// test if msg10 has 3 inline attachments
		if (msgId === '10') {
			expect(iframeContent).toContain('img src="/service/home/');
			expect(iframeContent).toContain('pnsrc="cid:b8c321cd-0b7b-4a18-8b86-da38b937b6eb');
			expect(iframeContent).toContain('pnsrc="cid:65766eee-4439-438c-a375-1ac111ed1a07');
			expect(iframeContent).toContain('pnsrc="cid:2dbe26b8-2c96-40a0-94c5-ad891bac1f9a');
		}

		// test if msg11 has a visible table
		if (msgId === '11' || msgId === '12') {
			expect(iframe).toBeVisible();
			expect(iframeContent).toContain('table');
		}
	});
});
