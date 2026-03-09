/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import * as CarbonioShellUI from '@zextras/carbonio-shell-ui';
import { HttpResponse } from 'msw';

import { setupTest } from '@test-setup';
import { createAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { useSmimeFeatureStore, useSmimePasswordStore } from 'store/certificates/store';
import { IncompleteMessage } from 'types/messages';
import { MailInfoBlock } from 'views/app/detail-panel/preview/parts/info-block/mail-info-block';

const validSignature = {
	type: 'S/MIME',
	trusted: true,
	issuer: 'Test Certificate data',
	email: 'user1@demo.zextras.io',
	notBefore: 1726312850000,
	notAfter: 1760440850000,
	message: 'valid issuer certificate',
	messageCode: 'VALID',
	valid: true
};

const mockMsg: IncompleteMessage = {
	signature: [validSignature],
	sensitivity: 'Private',
	creationDateFromMailHeaders: '2022-01-01',
	messageIdFromMailHeaders: 'test-message-id',
	messageIsFromDistributionList: true,
	messageIsFromExternalDomain: true,
	parts: [
		{
			contentType: 'application/pkcs7-mime',
			size: 1950,
			name: '1',
			filename: 'smime.p7m'
		}
	],
	isEncrypted: true
} as IncompleteMessage;

describe('MailInfoBlock', () => {
	const decryptMsgId = 'decrypt-message-link';
	const showDetailLbl = 'Show Details';

	it('correctly renders the show details link', () => {
		setupTest(<MailInfoBlock msg={mockMsg} />);
		expect(screen.getByText(showDetailLbl)).toBeInTheDocument();
	});

	it('renders SmimeIcon when signature is present', () => {
		setupTest(<MailInfoBlock msg={mockMsg} />);
		expect(screen.getByTestId('smime-icon')).toBeInTheDocument();
	});

	it('renders ExternalDomainIcon when message is from an external domain', () => {
		setupTest(<MailInfoBlock msg={mockMsg} />);
		expect(screen.getByTestId('external-domain-icon')).toBeInTheDocument();
	});

	it('renders MailSensitivityIcon when sensitivity is present', () => {
		setupTest(<MailInfoBlock msg={mockMsg} />);
		expect(screen.getByTestId('mail-sensitivity-icon')).toBeInTheDocument();
	});

	// it('renders MailAuthenticationHeaderIcon when authenticationHeaders are present', () => {
	// 	setupTest(<MailInfoBlock msg={mockMsg} />);
	// 	expect(screen.getByTestId('mail-authentication-header-icon')).toBeInTheDocument();
	// });

	it('renders DistributionListIcon when message is from a distribution list', () => {
		setupTest(<MailInfoBlock msg={mockMsg} />);
		expect(screen.getByTestId('distribution-list-icon')).toBeInTheDocument();
	});

	it('opens modal when "Show Details" link is clicked', async () => {
		const { user } = setupTest(<MailInfoBlock msg={mockMsg} />);

		await user.click(screen.getByText(showDetailLbl));
		expect(await screen.findByTestId('modal')).toBeInTheDocument();
	});

	it('does not render the show details link when no valid value is passed', () => {
		setupTest(<MailInfoBlock msg={{} as IncompleteMessage} />);
		expect(screen.queryByText(showDetailLbl)).not.toBeInTheDocument();
	});

	it('does not render the Decrypt Message link when no valid value is passed', () => {
		setupTest(<MailInfoBlock msg={{} as IncompleteMessage} />);
		expect(screen.queryByTestId(decryptMsgId)).not.toBeInTheDocument();
	});

	it('render the Decrypt Message link when valid value is passed', () => {
		vi.spyOn(CarbonioShellUI, 'useIsCarbonioCE').mockReturnValue(false);
		useSmimeFeatureStore.getState().updateIsSmimeEnabled(true);
		setupTest(<MailInfoBlock msg={mockMsg} />);
		expect(screen.getByTestId(decryptMsgId)).toBeInTheDocument();
	});

	it('does not render the Decrypt Message link when CarbonioCE', () => {
		vi.spyOn(CarbonioShellUI, 'useIsCarbonioCE').mockReturnValue(true);
		useSmimeFeatureStore.getState().updateIsSmimeEnabled(true);
		setupTest(<MailInfoBlock msg={mockMsg} />);
		expect(screen.queryByTestId(decryptMsgId)).not.toBeInTheDocument();
	});

	it('does not render the Decrypt Message link when isSmimeEnabled is false', () => {
		vi.spyOn(CarbonioShellUI, 'useIsCarbonioCE').mockReturnValue(false);
		useSmimeFeatureStore.getState().updateIsSmimeEnabled(false);
		setupTest(<MailInfoBlock msg={mockMsg} />);
		expect(screen.queryByTestId(decryptMsgId)).not.toBeInTheDocument();
	});

	it('render the Decrypt Message link modal should open on click', async () => {
		createAPIInterceptor(
			'get',
			'/service/extension/encryption/password/exist',
			HttpResponse.json({ status: 200 })
		);
		vi.spyOn(CarbonioShellUI, 'useIsCarbonioCE').mockReturnValue(false);
		vi.spyOn(CarbonioShellUI, 'useIsCarbonioCE').mockReturnValue(false);
		useSmimePasswordStore.getState().updateSmimePassword('');
		useSmimeFeatureStore.getState().updateIsSmimeEnabled(true);
		const { user } = setupTest(<MailInfoBlock msg={mockMsg} />);
		const decryptMsg = screen.getByTestId(decryptMsgId);
		await user.click(decryptMsg);
		expect(await screen.findByTestId('modal')).toBeInTheDocument();
	});
});
