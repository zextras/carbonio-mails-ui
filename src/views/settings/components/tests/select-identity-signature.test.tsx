/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { t as mockT } from '@zextras/carbonio-shell-ui';

import { setupTest } from '@test-setup';
import { PRIMARY_IDENTITY_NAME } from 'helpers/identities';
import { SignItemType } from 'types/settings';
import SelectIdentitySignature from 'views/settings/components/select-identity-signature';

describe('SelectIdentitySignature', () => {
	const mockUpdateIdentities = vi.fn();
	const mockDefaultAccount = {
		id: '0',
		name: PRIMARY_IDENTITY_NAME,
		_attrs: {
			zimbraPrefDefaultSignatureId: 'sig1',
			zimbraPrefForwardReplySignatureId: 'sig2'
		}
	};

	const mockNonDefaultAccount = {
		id: '1',
		name: 'Secondary Identity',
		_attrs: {
			zimbraPrefDefaultSignatureId: 'sig1',
			zimbraPrefForwardReplySignatureId: 'sig2'
		}
	};

	const mockSignatures: SignItemType[] = [
		{
			id: 'sig1',
			label: 'Signature 1 Label',
			name: 'signature 1',
			description: 'signature 1 description'
		}
	];
	const mockSignatureSelectItems = [
		{ value: 'sig1', label: 'Signature 1' },
		{ value: 'sig2', label: 'Signature 2' },
		{ value: 'no-signature', label: 'No Signature' }
	];

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders with default signatures selected', () => {
		setupTest(
			<SelectIdentitySignature
				acc={mockDefaultAccount}
				signatures={mockSignatures}
				signatureSelectItems={mockSignatureSelectItems}
				updateIdentities={mockUpdateIdentities}
			/>
		);

		// Assert that the translated string was called for default accounts
		expect(mockT).toHaveBeenCalledWith('settings.label.default', PRIMARY_IDENTITY_NAME);
		expect(screen.getByText('settings.label.default')).toBeInTheDocument(); // DEFAULT
		expect(screen.getByText('Signature 1 Label')).toBeInTheDocument();
	});

	it('renders non default accounts without translation', () => {
		setupTest(
			<SelectIdentitySignature
				acc={mockNonDefaultAccount}
				signatures={mockSignatures}
				signatureSelectItems={mockSignatureSelectItems}
				updateIdentities={mockUpdateIdentities}
			/>
		);

		// Assert that the translated string was not called for non-default accounts
		expect(mockT).not.toHaveBeenCalledWith('settings.label.default', 'Secondary Identity');
		expect(screen.getByText('Secondary Identity')).toBeInTheDocument();
		expect(screen.getByText('Signature 1 Label')).toBeInTheDocument();
	});
});
