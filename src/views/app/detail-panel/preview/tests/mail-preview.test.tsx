/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { generateMessage } from '__test__/generators/generateMessage';
import { getMsgSoapApi } from 'api/get-msg-soap-api';
import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
import MailPreview, { MailPreviewProps } from 'views/app/detail-panel/preview/mail-preview';

/**
 * Test the Mail Preview component in different scenarios
 */
// See: tests/mocks/network/msw/cases/getMsg/getMsg-${id} for relative msgId
describe('Mail preview', () => {
	const shadowDomWrapperTestId = 'shadow-dom-wrapper';

	it('msg 10 - 3 inline images', async () => {
		const getMsgResponse = await getMsgSoapApi({ msgId: '10', html: true });
		const message = normalizeMailMessageFromSoap({
			m: getMsgResponse?.m[0],
			isComplete: true,
			html: true
		});

		const props: MailPreviewProps = {
			message,
			expanded: true,
			isAlone: true,
			isMessageView: true
		};

		setupTest(<MailPreview {...props} />);

		const shadowRoot = (await screen.findByTestId(shadowDomWrapperTestId)).shadowRoot as ShadowRoot;
		const content = shadowRoot.innerHTML;

		// test if msg10 has 3 inline attachments
		expect(content).toContain('img src="/service/home/');
		expect(content).toContain('pnsrc="cid:2dbe26b8-2c96-40a0-94c5-ad891bac1f9a@zimbra');
		expect(content).toContain('pnsrc="cid:65766eee-4439-438c-a375-1ac111ed1a07');
		expect(content).toContain('pnsrc="cid:2dbe26b8-2c96-40a0-94c5-ad891bac1f9a');
	});

	it('msg 11 - table with a link', async () => {
		const getMsgResponse = await getMsgSoapApi({ msgId: '11', html: true });
		const message = normalizeMailMessageFromSoap({
			m: getMsgResponse?.m[0],
			isComplete: true,
			html: true
		});

		const props: MailPreviewProps = {
			message,
			expanded: true,
			isAlone: true,
			isMessageView: true
		};

		setupTest(<MailPreview {...props} />);
		const { shadowRoot }: HTMLDivElement = await screen.findByTestId(shadowDomWrapperTestId);
		const content = shadowRoot?.innerHTML.toString();

		expect(content).toContain('table');
	});

	it('msg 12 - table with width greater than the previewer width', async () => {
		const getMsgResponse = await getMsgSoapApi({ msgId: '12', html: true });
		const message = normalizeMailMessageFromSoap({
			m: getMsgResponse?.m[0],
			isComplete: true,
			html: true
		});

		const props: MailPreviewProps = {
			message,
			expanded: true,
			isAlone: true,
			isMessageView: true
		};

		// Render the component
		setupTest(<MailPreview {...props} />);
		const { shadowRoot }: HTMLDivElement = await screen.findByTestId(shadowDomWrapperTestId);
		const content = shadowRoot?.innerHTML.toString();

		expect(content).toContain('table');
	});

	describe('Actions', () => {
		it('should display edit action when message is in draft', async () => {
			const message = generateMessage({ isDraft: true, folderId: FOLDERS.DRAFTS });

			const props: MailPreviewProps = {
				message,
				expanded: true,
				isAlone: true,
				isMessageView: true
			};

			setupTest(<MailPreview {...props} />);
			const actionsContainer = screen.getByTestId(/MailMsgPreviewActions/);
			const actions = within(actionsContainer).getAllByTestId(/icon:/);
			expect(actions[0]).toHaveAttribute('data-testid', 'icon: Edit2Outline');
		});

		it('should not propagate click event when clicking on action button', async () => {
			const message = generateMessage({
				isDraft: true,
				folderId: FOLDERS.DRAFTS,
				isComplete: true,
				body: 'Test body'
			});

			const { user } = setupTest(
				<MailPreview
					{...{
						message,
						expanded: true,
						isAlone: false,
						isMessageView: false
					}}
				/>
			);

			const textMessageRendererContainer = screen.queryByTestId('text-message-renderer-container');
			expect(textMessageRendererContainer).toBeInTheDocument(); // expanded is true, so the preview should be open

			// clicking the action should not close(toggle the visibility) the preview
			await user.click(screen.getByTestId('icon: Edit2Outline'));
			expect(textMessageRendererContainer).toBeVisible();
		});
	});
});
