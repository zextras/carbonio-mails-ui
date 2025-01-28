/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { getMsgSoapApi } from '../../../../../api/get-msg-soap-api';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { normalizeMailMessageFromSoap } from '../../../../../normalizations/normalize-message';
import MailPreview, { MailPreviewProps } from '../mail-preview';

/**
 * Test the Mail Preview component in different scenarios
 */
// See: tests/mocks/network/msw/cases/getMsg/getMsg-${id} for relative msgId
describe('Mail preview', () => {
	const shadowDomWrapperTestId = 'shadow-dom-wrapper';

	it('10 - 3 inline images', async () => {
		const getMsgResponse = await getMsgSoapApi({ msgId: '10' });
		const message = normalizeMailMessageFromSoap(getMsgResponse?.m[0], true);

		const props: MailPreviewProps = {
			message,
			expanded: true,
			isAlone: true,
			isMessageView: true,
			messagePreviewFactory: () => <></>
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

	it('11 - table with a link', async () => {
		const getMsgResponse = await getMsgSoapApi({ msgId: '11' });
		const message = normalizeMailMessageFromSoap(getMsgResponse?.m[0], true);

		const props: MailPreviewProps = {
			message,
			expanded: true,
			isAlone: true,
			isMessageView: true,
			messagePreviewFactory: () => <></>
		};

		// Render the component
		setupTest(<MailPreview {...props} />);
		const { shadowRoot }: HTMLDivElement = await screen.findByTestId(shadowDomWrapperTestId);
		const content = shadowRoot?.innerHTML.toString();

		expect(content).toContain('table');
	});

	it('12 - table with width greater than the previewer width', async () => {
		const getMsgResponse = await getMsgSoapApi({ msgId: '12' });
		const message = normalizeMailMessageFromSoap(getMsgResponse?.m[0], true);

		const props: MailPreviewProps = {
			message,
			expanded: true,
			isAlone: true,
			isMessageView: true,
			messagePreviewFactory: () => <></>
		};

		// Render the component
		setupTest(<MailPreview {...props} />);
		const { shadowRoot }: HTMLDivElement = await screen.findByTestId(shadowDomWrapperTestId);
		const content = shadowRoot?.innerHTML.toString();

		expect(content).toContain('table');
	});
});
