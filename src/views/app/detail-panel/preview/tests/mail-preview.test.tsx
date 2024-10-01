/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { getMsg } from '../../../../../store/actions';
import { selectMessage } from '../../../../../store/messages-slice';
import { generateStore } from '../../../../../tests/generators/store';
import MailPreview, { MailPreviewProps } from '../mail-preview';

/**
 * Test the Mail Preview component in different scenarios
 */
// See: tests/mocks/network/msw/cases/getMsg/getMsg-${id} for relative msgId
describe('Mail preview', () => {
	it('10 - 3 inline images', async () => {
		const store = generateStore();
		const msgId = '10';

		// Invoke the fetch of the message and the store update
		await store.dispatch<any>(getMsg({ msgId }));
		const state = store.getState();
		const message = selectMessage(state, msgId);
		const props: MailPreviewProps = {
			message,
			expanded: true,
			isAlone: true,
			isMessageView: true,
			messageActions: []
		};

		// Render the component
		setupTest(<MailPreview {...props} />, { store });

		const messageRenderer: HTMLDivElement = await screen.findByTestId('message-renderer-container');
		const content = messageRenderer.innerHTML.toString();

		// test if msg10 has 3 inline attachments
		expect(content).toContain('img src="/service/home/');
		expect(content).toContain('pnsrc="cid:b8c321cd-0b7b-4a18-8b86-da38b937b6eb');
		expect(content).toContain('pnsrc="cid:65766eee-4439-438c-a375-1ac111ed1a07');
		expect(content).toContain('pnsrc="cid:2dbe26b8-2c96-40a0-94c5-ad891bac1f9a');
	});

	it('11 - table with a link', async () => {
		const store = generateStore();
		const msgId = '11';

		// Invoke the fetch of the message and the store update
		await store.dispatch<any>(getMsg({ msgId }));
		const state = store.getState();
		const message = selectMessage(state, msgId);
		const props: MailPreviewProps = {
			message,
			expanded: true,
			isAlone: true,
			isMessageView: true,
			messageActions: []
		};

		// Render the component
		setupTest(<MailPreview {...props} />, { store });
		const messageRenderer: HTMLDivElement = await screen.findByTestId('message-renderer-container');
		const content = messageRenderer.innerHTML.toString();

		expect(messageRenderer).toBeVisible();
		expect(content).toContain('table');
	});

	it('12 - table with width greater than the previewer width', async () => {
		const store = generateStore();
		const msgId = '12';

		// Invoke the fetch of the message and the store update
		await store.dispatch<any>(getMsg({ msgId }));
		const state = store.getState();
		const message = selectMessage(state, msgId);
		const props: MailPreviewProps = {
			message,
			expanded: true,
			isAlone: true,
			isMessageView: true,
			messageActions: []
		};

		// Render the component
		setupTest(<MailPreview {...props} />, { store });
		const messageRenderer: HTMLDivElement = await screen.findByTestId('message-renderer-container');
		const content = messageRenderer.innerHTML.toString();

		expect(messageRenderer).toBeVisible();
		expect(content).toContain('table');
	});
});
