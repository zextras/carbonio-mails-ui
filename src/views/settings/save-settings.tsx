/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Identity, updateAccount, updateSettings, xmlSoapFetch } from '@zextras/carbonio-shell-ui';
import { isArray, map } from 'lodash';

import { MAIL_APP_ID } from '../../constants';

type AccountSettings = {
	[key: string]: string | number | Array<string | number> | undefined;
};

type AccountSettingsPrefs = AccountSettings;
type AccountSettingsAttrs = AccountSettings;
type IdentityAttrs = AccountSettings;

type PropsMods = Record<string, { app: string; value: unknown }>;
type PrefsMods = Record<string, unknown> & AccountSettingsPrefs;
type AttrsMods = Record<string, unknown> & AccountSettingsAttrs;

type IdentityMods = {
	modifyList?: Record<string, { id: string; prefs: Partial<IdentityAttrs> }>;
	deleteList?: string[];
	createList?: { prefs: Partial<IdentityAttrs> }[];
};

interface Mods extends Record<string, Record<string, unknown> | undefined> {
	props?: PropsMods;
	prefs?: PrefsMods;
	attrs?: AttrsMods;
	identity?: IdentityMods;
}

export type SaveSettingsResponse = {
	CreateIdentityResponse?: {
		identity: [Identity];
	}[];
};

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

export const saveSettings = (
	mods: Mods,
	appId = MAIL_APP_ID
): Promise<{
	CreateIdentityResponse?: {
		identity: [Identity];
	}[];
}> =>
	xmlSoapFetch<string, SaveSettingsResponse>(
		'Batch',
		`<BatchRequest xmlns="urn:zimbra" onerror="stop">
				${getRequestForProps(mods.props, appId)}
				${getRequestForAmavisSendersListAttrs(mods.attrs)}
				${getRequestForIdentities(mods.identity)}
		</BatchRequest>`
	).then((resp) => {
		updateSettings(mods);
		if (mods.identity) {
			const identities = {
				identitiesMods: mods.identity,
				newIdentities: resp.CreateIdentityResponse?.map((item) => item?.identity[0]) ?? []
			};
			updateAccount({ identities });
		}
		return resp;
	});
