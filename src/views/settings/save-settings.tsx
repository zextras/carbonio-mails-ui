/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { updateAccount, updateSettings, xmlSoapFetch } from '@zextras/carbonio-shell-ui';
import type {
	EditSettingsBatchResponse,
	IdentityMods,
	Mods,
	PropsMods,
	AttrsMods
} from '@zextras/carbonio-shell-ui';
import { isArray, map } from 'lodash';

import { MAIL_APP_ID } from '../../constants';

export type SaveSettingsResponse = Pick<
	EditSettingsBatchResponse,
	| 'ModifyPropertiesResponse'
	| 'ModifyPrefsResponse'
	| 'ModifyIdentityResponse'
	| 'CreateIdentityResponse'
>;

function getRequestForProps(props: PropsMods | undefined, appId: string): string {
	return props
		? `<ModifyPropertiesRequest xmlns="urn:zimbraAccount">${map(
				props,
				(prop, key) => `<prop name="${key}" zimlet="${prop.app ?? appId}">${prop.value}</prop>`
			)}</ModifyPropertiesRequest>`
		: '';
}

function getRequestForAmavisSendersListAttrs(attrs: AttrsMods | undefined): string {
	return attrs?.amavisWhitelistSender || attrs?.amavisBlacklistSender
		? `<ModifyWhiteBlackListRequest xmlns="urn:zimbraAccount">${
				attrs?.amavisWhitelistSender && isArray(attrs?.amavisWhitelistSender)
					? `<whiteList>${attrs?.amavisWhitelistSender
							.map((email) => `<addr>${email}</addr>`)
							.join('')}</whiteList>`
					: ''
			}${
				attrs?.amavisBlacklistSender && isArray(attrs?.amavisBlacklistSender)
					? `<blackList>${attrs?.amavisBlacklistSender
							.map((email) => `<addr>${email}</addr>`)
							.join('')}</blackList>`
					: ''
			}</ModifyWhiteBlackListRequest>`
		: '';
}

function getRequestForIdentities(identity: IdentityMods | undefined): string {
	return `${
		identity?.modifyList
			? map(
					identity.modifyList,
					(item) =>
						`<ModifyIdentityRequest xmlns="urn:zimbraAccount" requestId="0"><identity id="${
							item.id
						}">${map(item.prefs, (value, key) => `<a name="${key}">${value}</a>`).join(
							''
						)}</identity></ModifyIdentityRequest>`
				).join('')
			: ''
	}`;
}

export const saveSettings = (mods: Mods, appId = MAIL_APP_ID): Promise<SaveSettingsResponse> =>
	xmlSoapFetch<string, SaveSettingsResponse>(
		'Batch',
		`<BatchRequest xmlns="urn:zimbra" onerror="stop">
				${getRequestForProps(mods.props, appId)}
				${getRequestForAmavisSendersListAttrs(mods.attrs)}
				${getRequestForIdentities(mods.identity)}
		</BatchRequest>`
	).then((resp) => {
		updateSettings(mods);
		updateAccount(mods, resp);
		return resp;
	});
