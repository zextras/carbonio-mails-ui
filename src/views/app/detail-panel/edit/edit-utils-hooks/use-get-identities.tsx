/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Avatar, Container, Text } from '@zextras/carbonio-design-system';
import { useUserAccount, useUserAccounts, useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter, find, findIndex, flatten, isNull, map } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ParticipantRole } from '../../../../../carbonio-ui-commons/constants/participants';
import { useRoots } from '../../../../../carbonio-ui-commons/store/zustand/folder/hooks';
import { getRecipientReplyIdentity } from '../../../../../helpers/identities';
import type {
	FindDefaultIdentityType,
	IdentityType,
	MailMessage,
	MailsEditor,
	UseGetIdentitiesReturnType
} from '../../../../../types';

export const findDefaultIdentity = ({
	list,
	allAccounts,
	folderId,
	currentMessage,
	originalMessage,
	account,
	settings
}: FindDefaultIdentityType): IdentityType | undefined => {
	let predicate;

	/*
	 * If the message is a reply or a forward, the identity of the sender is determined
	 * by the recipients of original message and the owning folder of the current message.
	 */
	if (originalMessage) {
		const replyIdentity = getRecipientReplyIdentity(
			allAccounts,
			account,
			settings,
			originalMessage
		);
		if (replyIdentity.identityName) {
			predicate = { identityName: replyIdentity.identityName };
		}
	}

	/*
	 * If the message is a draft and the sender is already set in it, the identity is
	 * chosen within the list of identities based on the info of the sender of the draft.
	 */
	if (!predicate && currentMessage?.isDraft && currentMessage?.participants) {
		const sender = find(currentMessage.participants, { type: ParticipantRole.FROM });
		if (sender) {
			predicate = {
				address: sender.address
			};
		}
	}

	if (!predicate && folderId) {
		const activeAcc = find(allAccounts, { zid: folderId?.split?.(':')?.[0] });
		predicate =
			activeAcc && 'owner' in activeAcc && activeAcc?.owner
				? { address: activeAcc?.owner }
				: { identityName: 'DEFAULT' };
	}

	const result = find(list, predicate) as IdentityType | undefined;
	return result;
};

type UseGetIdentitiesPropType = {
	updateEditorCb: (arg: Partial<MailsEditor>) => void;
	setOpen: (arg: boolean) => void;
	onFromChange?: (arg: Partial<IdentityType> | undefined) => void;
	editorId: string;
	currentMessage?: MailMessage;
	originalMessage?: MailMessage;
	folderId: string;
};
export const useGetIdentities = ({
	updateEditorCb,
	setOpen,
	onFromChange,
	editorId,
	currentMessage,
	originalMessage,
	folderId
}: UseGetIdentitiesPropType): UseGetIdentitiesReturnType => {
	const account = useUserAccount();
	const settings = useUserSettings();
	const accounts = useUserAccounts();
	const [t] = useTranslation();
	const [from, setFrom] = useState<Partial<IdentityType>>();
	const [list, setList] = useState<Array<IdentityType>>([]);
	const [activeFrom, setActiveFrom] = useState<IdentityType>();
	const [isIdentitySet, setIsIdentitySet] = useState(false);
	const [defaultIdentity, setDefaultIdentity] = useState<IdentityType>();
	const allAccounts = useRoots();

	const noName = useMemo(() => t('label.no_name', '<No Name>'), [t]);

	useEffect(() => {
		const identityList = map(account.identities.identity, (item, idx) => ({
			value: idx,
			label: `${item.name ?? ''}(${item._attrs?.zimbraPrefFromDisplay ?? ''}  <${
				item._attrs?.zimbraPrefFromAddress
			}>)`,
			address: item._attrs?.zimbraPrefFromAddress,
			name: item.name,
			fullname: item._attrs?.zimbraPrefFromDisplay ?? '',
			type: item._attrs.zimbraPrefFromAddressType,
			identityName: item.name ?? '',
			displayName: item._attrs?.zimbraPrefIdentityName ?? '',
			zimbraPrefDefaultSignatureId: item._attrs?.zimbraPrefDefaultSignatureId,
			zimbraPrefForwardReplySignatureId: item._attrs?.zimbraPrefForwardReplySignatureId
		}));
		const rightsList = flatten(
			map(
				filter(
					account?.rights?.targets,
					(rts) => rts.right === 'sendAs' || rts.right === 'sendOnBehalfOf'
				),
				(ele, idx) =>
					map(ele?.target, (item: { d: string; email: Array<{ addr: string }> }) => ({
						value: idx + identityList.length,
						label:
							ele.right === 'sendAs'
								? `${item.d}<${item.email[0].addr}>`
								: ` ${accounts[0].name} ${t('label.on_behalf_of', 'on behalf of')} ${item.d}<${
										item.email[0].addr
								  }>`,
						address: item.email[0].addr,
						fullname: item.d,
						type: ele.right,
						identityName: '',
						displayName: '',
						zimbraPrefDefaultSignatureId: '',
						zimbraPrefForwardReplySignatureId: ''
					}))
			)
		);

		const flattenList = flatten(rightsList);

		const uniqueIdentityList: IdentityType[] = [...identityList];
		if (flattenList?.length) {
			map(flattenList, (ele: IdentityType) => {
				const uniqIdentity = findIndex(identityList, { address: ele.address });
				if (uniqIdentity < 0) uniqueIdentityList.push(ele);
			});
			setList(uniqueIdentityList);
		} else setList(identityList);
	}, [account, accounts, defaultIdentity?.address, defaultIdentity?.fullname, t, updateEditorCb]);

	useEffect(() => {
		if (!isIdentitySet && list.length > 0 && !isNull(from)) {
			const def = findDefaultIdentity({
				list,
				allAccounts,
				folderId,
				currentMessage: editorId?.includes('new-') ? undefined : currentMessage,
				originalMessage,
				account,
				settings
			});

			updateEditorCb({
				from: {
					address: def?.address,
					fullName: def?.fullname,
					name: def?.fullname,
					type: ParticipantRole.FROM
				}
			});
			setDefaultIdentity(def);
			setActiveFrom(def);
			setFrom(def);
			onFromChange && onFromChange(def);
			setIsIdentitySet(true);
		}
	}, [
		allAccounts,
		editorId,
		folderId,
		list,
		updateEditorCb,
		isIdentitySet,
		from,
		originalMessage,
		account,
		settings,
		currentMessage,
		onFromChange
	]);
	const identitiesList = useMemo(
		() =>
			list.map((el: IdentityType) => ({
				label: el.label,
				value: el.value,
				address: el.address,
				fullname: el.fullName || el.fullname,
				type: el.type,
				identityName: el.identityName,
				displayName: el.displayName,

				onClick: (): void => {
					setActiveFrom(el);
					const data = {
						address: el.address,
						fullName: el.fullname,
						name: el.address,
						type: ParticipantRole.FROM,
						identityName: el.identityName,
						displayName: el.displayName,
						zimbraPrefDefaultSignatureId: el?.zimbraPrefDefaultSignatureId,
						zimbraPrefForwardReplySignatureId: el?.zimbraPrefForwardReplySignatureId
					};

					updateEditorCb({ from: data });

					if (el.type === 'sendOnBehalfOf') {
						updateEditorCb({
							sender: {
								address: accounts[0].name,
								fullName: accounts[0].displayName,
								name: accounts[0].name,
								type: ParticipantRole.SENDER
							}
						});
					}
					setFrom(data);
					onFromChange && onFromChange(data);
					setOpen(false);
				},
				selected: el === activeFrom,
				customComponent: (
					<Container width="100%" orientation="horizontal" height="fit">
						<Avatar label={el.displayName || el.fullname || noName} />
						<Container
							width="100%"
							crossAlignment="flex-start"
							height="fit"
							padding={{ left: 'medium' }}
						>
							<Text weight="bold">{el.displayName || el.fullname || noName}</Text>
							{el.type === 'sendOnBehalfOf' ? (
								<Text color="gray1"> {el.label} </Text>
							) : (
								<Text color="gray1">{`${el.fullname} <${el.address}>`}</Text>
							)}
						</Container>
					</Container>
				)
			})),
		[accounts, activeFrom, list, noName, onFromChange, setOpen, updateEditorCb]
	);
	const hasIdentity = useMemo(() => list.length > 1, [list]);

	return { from, activeFrom, identitiesList, hasIdentity };
};
