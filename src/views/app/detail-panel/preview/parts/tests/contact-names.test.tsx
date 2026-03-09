/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { useUserAccounts } from '@zextras/carbonio-shell-ui';
import type { Mock } from 'vitest';

import { setupTest } from '@test-setup';
import { Participant } from 'types/participant';
import ContactName from 'views/app/detail-panel/preview/parts/contact-names';

describe('ContactName component', () => {
	beforeEach(() => {
		(useUserAccounts as Mock).mockReturnValue([{ address: 'user@example.com' }]);
	});

	it('renders contact names without overflow', () => {
		const contacts: Participant[] = [
			{
				address: 'contact1@example.com',
				name: 'Contact 1',
				type: 'b'
			},
			{
				address: 'contact2@example.com',
				name: 'Contact 2',
				type: 'b'
			}
		];

		setupTest(<ContactName showOverflow={false} contacts={contacts} label="To:" />);

		expect(screen.getByText('Contact 1')).toBeInTheDocument();
		expect(screen.getByText('Contact 2')).toBeInTheDocument();
	});

	it('handles empty contacts list', () => {
		const contacts: Participant[] = [];

		setupTest(<ContactName showOverflow={false} contacts={contacts} label="To:" />);

		expect(screen.queryByText('...')).not.toBeInTheDocument();
	});

	it('renders label correctly', () => {
		const contacts: Participant[] = [
			{
				address: 'contact1@example.com',
				name: 'Contact 1',
				type: 'b'
			}
		];

		setupTest(<ContactName showOverflow={false} contacts={contacts} label="Cc:" />);

		expect(screen.getByText('Cc:')).toBeInTheDocument();
	});

	it('should preserve the casing of the contact name', () => {
		const contacts: Participant[] = [
			{
				address: 'Contact1@Example.com',
				name: 'Contact One',
				type: 'b'
			},
			{
				address: 'contact2@example.com',
				name: 'contact two',
				type: 'b'
			}
		];

		setupTest(<ContactName contacts={contacts} label="To:" />);

		expect(screen.getByText('Contact One')).toBeInTheDocument();
		expect(screen.getByText('contact two')).toBeInTheDocument();
	});

	it('should preserve the casing of the contact address', () => {
		const contacts: Participant[] = [
			{
				address: 'Contact1@Example.com',
				name: undefined,
				type: 'b'
			},
			{
				address: 'contact2@example.com',
				name: undefined,
				type: 'b'
			}
		];

		// falls back to address if name is not provided
		setupTest(<ContactName contacts={contacts} label="To:" />);

		expect(screen.getByText('Contact1@Example.com')).toBeInTheDocument();
		expect(screen.getByText('contact2@example.com')).toBeInTheDocument();
	});

	it('should preserve the casing of the contact fullName', () => {
		const contacts: Participant[] = [
			{
				address: 'Contact1@Example.com',
				fullName: 'Kirpal singh',
				type: 'b'
			},
			{
				address: 'contact2@example.com',
				fullName: 'madan PAul',
				type: 'b'
			}
		];

		// uses fullName when Available
		setupTest(<ContactName contacts={contacts} label="To:" />);

		expect(screen.getByText('Kirpal singh')).toBeInTheDocument();
		expect(screen.getByText('madan PAul')).toBeInTheDocument();
	});
});
