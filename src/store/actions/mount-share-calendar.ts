/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';

export const mountSharedCalendar = createAsyncThunk(
	'calendar/mountSharedCalendar',
	async (data: any, { getState }) => {
		const requests: any = {};
		requests.mountSharedCalendarRequest = `<CreateMountpointRequest xmlns="urn:zimbraMail">
        <link l="1" name="${data.calendarName}" zid="${data.zid}" rid="${data.rid}" view="${data.view}" color="${data.color}" f="#"/>
        </CreateMountpointRequest>`;

		const res = await fetch('/service/soap/CreateMountpointRequest', {
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
					${requests.mountSharedCalendarRequest ?? ''}				
				</soap:Body>
			</soap:Envelope>
		`
		});
		const response = await res.json();
		if (response.Body.Fault) {
			throw new Error(response.Body.Fault.Reason.Text);
		}

		return { response };
	}
);
