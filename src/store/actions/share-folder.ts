/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { map, trim } from 'lodash';

export const shareFolder = createAsyncThunk('mail/shareFolder', async (data: any, { getState }) => {
	const requests: any = {};
	requests.ShareCalendarRequest = `<BatchRequest xmlns="urn:zimbra" onerror="stop">
        ${map(
					data.contacts,
					(
						contact,
						key
					) => `<FolderActionRequest xmlns="urn:zimbraMail" requestId="${key}"><action op="grant" id="${
						data.folder.id
					}">
        <grant gt="usr" inh="1" d="${trim(contact.email, '<>')}" perm="${
						data.shareWithUserRole
					}" pw=""/></action></FolderActionRequest>`
				).join('')}    
        </BatchRequest>`;

	const res = await fetch('/service/soap/BatchRequest', {
		method: 'POST',
		headers: {
			'content-type': 'application/soap+xml'
		},
		body: `<?xml version="1.0" encoding="utf-8"?>
			<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
				<soap:Header>
					<context xmlns="urn:zimbra">
						<account by="name">${data.accounts[0].name}</account>
						<format type="js"/>
					</context>
				</soap:Header>
				<soap:Body>
					${requests.ShareCalendarRequest ?? ''}				
				</soap:Body>
			</soap:Envelope>
		`
	});
	const response = await res.json();
	if (response.Body.Fault) {
		throw new Error(response.Body.Fault.Reason.Text);
	}

	return { response };
});
