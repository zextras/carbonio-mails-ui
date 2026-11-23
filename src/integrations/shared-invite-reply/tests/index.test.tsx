/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';

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

	describe('notes', () => {
		const sharedContent = `
		<share action="new" version="0.2" xmlns="urn:zimbraShare">
			<grantee name="user@demo.test.io" id="5194ecab-3452-42d7-8591-2ed1883abb49" email="user@demo.test.io"/>
			<grantor name="grantor name" id="78d3a764-ffd5-49ed-b212-4fbaf688c471" email="user@demo.test.io"/>
			<link view="message" perm="r" name="Inbox" id="2"/>
		</share>`;

		it('should show the notes written by the sharer', async () => {
			const mailMsg = generateMessage({
				id: '1',
				body: '<div>Share details<hr /><p>Please have a look &amp; reply<br>Thanks<br></p></div>'
			});
			const { user } = setupTest(
				<SharedCalendarResponse sharedContent={sharedContent} mailMsg={mailMsg} />
			);

			await user.click(screen.getByRole('button', { name: /label\.show_more_info/i }));

			const notes = screen.getByText(/Please have a look & reply/);
			expect(notes).toBeVisible();
			expect(notes).toHaveTextContent(/^Please have a look & reply\nThanks$/, {
				normalizeWhitespace: false
			});
		});

		it('should show markup in the notes as plain text', async () => {
			const mailMsg = generateMessage({
				id: '1',
				body: 'Share details<hr /><span data-testid="notes-markup">formatted</span> notes'
			});
			const { user } = setupTest(
				<SharedCalendarResponse sharedContent={sharedContent} mailMsg={mailMsg} />
			);

			await user.click(screen.getByRole('button', { name: /label\.show_more_info/i }));

			const notes = screen.getByText('formatted notes');
			expect(notes).toBeVisible();
			expect(within(notes).queryByTestId('notes-markup')).not.toBeInTheDocument();
			expect(screen.queryByTestId('notes-markup')).not.toBeInTheDocument();
		});
	});
});
