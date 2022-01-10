/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { map } from 'lodash';

export const sendShareNotification = createAsyncThunk(
	'mail/sendShareNotification',
	async (data: any, { getState }) =>
		Promise.all(
			map(data.contacts, (contact, index) =>
				fetch('/service/soap/SendShareNotificationRequest', {
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
                    <SendShareNotificationRequest xmlns="urn:zimbraMail">
                           <item id="${data.folder.id}"/>
                           <e a="${contact.email}"/>
                           ${
															data.standardMessage.length > 0
																? `<notes>${data.standardMessage}</notes>`
																: ''
														}
                           
                    </SendShareNotificationRequest>				
                    </soap:Body>
                </soap:Envelope>
            `
				}).then((resData) => resData.json())
			)
		)
);
