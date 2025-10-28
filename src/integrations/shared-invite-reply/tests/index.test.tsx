/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { generateMessage } from '__test__/generators/generateMessage';
import SharedCalendarResponse from 'integrations/shared-invite-reply/index';

describe('SharedCalendarResponse component', () => {
	it('should use a non-ambiguous name for the folder', async () => {
		const sharedContent =
			'<share action="new" version="0.2" xmlns="urn:zimbraShare">\n' +
			'  <grantee name="user@demo.test.io" id="657256aa-0f56-460a-9922-ff048da17af7" email="user@demo.test.io"/>\n' +
			'  <grantor name="who is sharing" id="268dc8e8-0761-458b-bc98-f850e7e8159c" email="user@demo.test.io"/>\n' +
			'  <link view="message" perm="rwidxa" name="Inbox" id="2"/>\n' +
			'</share>';
		const mailMsg = generateMessage({ id: '1' });

		setupTest(<SharedCalendarResponse sharedContent={sharedContent} mailMsg={mailMsg} />);

		const folderNameInput = await screen.findByRole('textbox', { name: /label\.folder_name/i });
		expect(folderNameInput).toHaveValue('Inbox label.of who is sharing'); // Inbox of who is sharing
	});

	it('should render the name of the sharer on calendar share', () => {
		const name = 'Calendar';
		const grantorName = 'grantor name';
		const sharedContent = `
		<share action="new" version="0.2" xmlns="urn:zimbraShare">		
			<grantee name="user@demo.test.io" id="5194ecab-3452-42d7-8591-2ed1883abb49" email="user@demo.test.io"/>
			<grantor name="${grantorName}" id="78d3a764-ffd5-49ed-b212-4fbaf688c471" email="user@demo.test.io"/>
			<link view="appointment" perm="r" name="${name}" id="10"/>
		</share>`;
		const mailMsg = generateMessage({ id: '1' });
		setupTest(<SharedCalendarResponse sharedContent={sharedContent} mailMsg={mailMsg} />);

		const folderNameInput = screen.getByRole('textbox', { name: /label.calendar_name/i });
		expect(folderNameInput).toHaveValue(`${name} label.of ${grantorName}`);
	});

	it('should render the name of the sharer on contact share', () => {
		const name = 'Contact';
		const grantorName = 'grantor name';
		const sharedContent = `
		<share action="new" version="0.2" xmlns="urn:zimbraShare">
			<grantee name="user@demo.test.io" id="5194ecab-3452-42d7-8591-2ed1883abb49" email="user@demo.test.io"/>
			<grantor name="${grantorName}" id="78d3a764-ffd5-49ed-b212-4fbaf688c471" email="user@demo.test.io"/>
			<link view="contact" perm="r" name="${name}" id="7"/>
		</share>`;
		const mailMsg = generateMessage({ id: '1' });
		setupTest(<SharedCalendarResponse sharedContent={sharedContent} mailMsg={mailMsg} />);

		const folderNameInput = screen.getByRole('textbox', { name: /label.addressbook_name/i });
		expect(folderNameInput).toHaveValue(`${name} label.of ${grantorName}`);
	});
});
