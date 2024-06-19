/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Identity, xmlSoapFetch } from '@zextras/carbonio-shell-ui';
import { useAccountStore } from '@zextras/carbonio-shell-ui/lib/store/account';
import {
	Account,
	AccountSettingsAttrs,
	AccountSettingsPrefs,
	AccountState,
	ZimletProp
} from '@zextras/carbonio-shell-ui/lib/types/account';
import type {
	CreateIdentityResponse,
	DeleteIdentityResponse,
	IdentityMods,
	ModifyIdentityResponse,
	ModifyPrefsResponse,
	ModifyPropertiesResponse,
	Mods,
	PropsMods
} from '@zextras/carbonio-shell-ui/lib/types/network';
import { filter, find, findIndex, isArray, map, reduce } from 'lodash';

import { MAIL_APP_ID } from '../../constants';

export type AttrsMods = Record<string, unknown>;

type MailMods = Mods & {
	attrs?: AttrsMods;
};

export type SaveSettingsResponse = {
	ModifyPropertiesResponse?: ModifyPropertiesResponse[];
	ModifyPrefsResponse?: ModifyPrefsResponse[];
	ModifyIdentityResponse?: ModifyIdentityResponse[];
	DeleteIdentityResponse?: DeleteIdentityResponse[];
	CreateIdentityResponse?: CreateIdentityResponse[];
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
	}${
		identity?.deleteList
			? map(
					identity.deleteList,
					(item) =>
						`<DeleteIdentityRequest xmlns="urn:zimbraAccount" requestId="0"><identity id="${item}"/></DeleteIdentityRequest>`
				).join('')
			: ''
	}${
		identity?.createList
			? map(
					identity.createList,
					(item, index) =>
						`<CreateIdentityRequest xmlns="urn:zimbraAccount" requestId="${index}"><identity name="${item.prefs.zimbraPrefIdentityName}"><a name="zimbraPrefIdentityName">${item.prefs.zimbraPrefIdentityName}</a><a name="zimbraPrefFromDisplay">${item.prefs.zimbraPrefFromDisplay}</a><a name="zimbraPrefFromAddress">${item.prefs.zimbraPrefFromAddress}</a><a name="zimbraPrefFromAddressType">sendAs</a><a name="zimbraPrefReplyToEnabled">${item.prefs.zimbraPrefReplyToEnabled}</a><a name="zimbraPrefReplyToDisplay">${item.prefs.zimbraPrefReplyToDisplay}</a><a name="zimbraPrefReplyToAddress">${item.prefs.zimbraPrefReplyToAddress}</a><a name="zimbraPrefDefaultSignatureId">${item.prefs.zimbraPrefDefaultSignatureId}</a><a name="zimbraPrefForwardReplySignatureId">${item.prefs.zimbraPrefForwardReplySignatureId}</a><a name="zimbraPrefWhenSentToEnabled">${item.prefs.zimbraPrefWhenSentToEnabled}</a><a name="zimbraPrefWhenInFoldersEnabled">${item.prefs.zimbraPrefWhenInFoldersEnabled}</a></identity></CreateIdentityRequest>`
				).join('')
			: ''
	}`;
}

function mergePrefs(
	mods: Partial<Mods & { attrs?: AttrsMods }>,
	s: AccountState
): AccountSettingsPrefs {
	return reduce(
		mods.prefs,
		(acc, pref, key) => ({
			...acc,
			[key]: pref as string
		}),
		s.settings.prefs
	);
}

function mergeAttrs(
	mods: Partial<Mods & { attrs?: AttrsMods }>,
	s: AccountState
): AccountSettingsAttrs {
	return reduce(
		mods.attrs,
		(acc, attr, key) => ({
			...acc,
			[key]: attr as string
		}),
		s.settings.attrs
	);
}

function mergeProps(
	mods: Partial<Mods & { attrs?: AttrsMods }>,
	s: AccountState
): Array<ZimletProp> {
	return reduce(
		mods.props,
		(acc, { app, value }, key) => {
			const propIndex = findIndex(acc, (p) => p.name === key && p.zimlet === app);
			if (propIndex >= 0) {
				// eslint-disable-next-line no-param-reassign
				acc[propIndex] = {
					name: key,
					zimlet: app,
					_content: value as string
				};
			} else {
				acc.push({
					name: key,
					zimlet: app,
					_content: value as string
				});
			}
			return acc;
		},
		s.settings.props
	);
}

function updateIdentities(
	s: AccountState,
	mods: Partial<Mods & { attrs?: AttrsMods }>,
	r: SaveSettingsResponse
): Identity[] | undefined {
	return typeof s.account !== 'undefined'
		? reduce(
				mods?.identity?.modifyList,
				(acc, { id, prefs }) => {
					const propIndex = findIndex(acc, (itemMods, indexAccount) => acc[indexAccount].id === id);
					if (propIndex > -1) {
						// eslint-disable-next-line no-param-reassign
						acc[propIndex]._attrs = {
							...acc[propIndex]._attrs,
							...prefs
						};
						if (prefs.zimbraPrefIdentityName && acc[propIndex].name !== 'DEFAULT') {
							// eslint-disable-next-line no-param-reassign
							acc[propIndex].name = prefs.zimbraPrefIdentityName;
						}
					}
					return acc;
				},
				[
					...filter(
						s.account.identities.identity,
						(item) => !mods?.identity?.deleteList?.includes(item.id)
					).filter((i) => i.name !== 'DEFAULT'),
					...map(r?.CreateIdentityResponse, (item) => item.identity[0]),
					...filter(
						s.account.identities.identity,
						(item) => !mods?.identity?.deleteList?.includes(item.id)
					).filter((i) => i.name === 'DEFAULT')
				]
			)
		: undefined;
}

function updateAccountStore(
	mods: Partial<Mods & { attrs?: AttrsMods }>,
	r: SaveSettingsResponse
): void {
	useAccountStore.setState((s: AccountState) => ({
		settings: {
			...s.settings,
			prefs: mergePrefs(mods, s),
			attrs: mergeAttrs(mods, s),
			props: mergeProps(mods, s)
		},
		account: {
			...s.account,
			displayName:
				find(mods?.identity?.modifyList, (item) => item.id === s?.account?.id)?.prefs
					.zimbraPrefIdentityName || s.account?.displayName,
			identities: {
				identity: updateIdentities(s, mods, r)
			}
		} as Account
	}));
}

const save = (
	mods: Partial<MailMods>,
	appId: string = MAIL_APP_ID
): Promise<SaveSettingsResponse> =>
	xmlSoapFetch<string, SaveSettingsResponse>(
		'Batch',
		`<BatchRequest xmlns="urn:zimbra" onerror="stop">
				${getRequestForProps(mods.props, appId)}
				${getRequestForAmavisSendersListAttrs(mods.attrs)}
				${getRequestForIdentities(mods.identity)}
		</BatchRequest>`
	).then((resp) => {
		updateAccountStore(mods, resp);
		return resp;
	});

export const saveSettings = (
	mods: MailMods
): Promise<SaveSettingsResponse & { type: 'fulfilled' }> =>
	save(mods, MAIL_APP_ID).then((resp) => ({
		...resp,
		type: 'fulfilled'
	}));
