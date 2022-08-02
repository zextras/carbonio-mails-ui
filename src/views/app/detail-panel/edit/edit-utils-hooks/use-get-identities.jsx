/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Text } from '@zextras/carbonio-design-system';
import { useRoots, useUserAccount, useUserAccounts } from '@zextras/carbonio-shell-ui';
import { map, find, filter, findIndex, flatten } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useParams } from 'react-router-dom';
import { ParticipantRole } from '../../../../../commons/utils';

export const findDefaultIdentity = ({ list, allAccounts, folderId }) => {
	const activeAcc = find(allAccounts, { zid: folderId?.split?.(':')?.[0] });
	return find(list, { address: activeAcc?.owner }) ?? find(list, { identityName: 'DEFAULT' });
};

export const useGetIdentities = ({ updateEditorCb, setOpen, editorId, action }) => {
	const account = useUserAccount();
	const accounts = useUserAccounts();
	const [t] = useTranslation();
	const [from, setFrom] = useState({});
	const [list, setList] = useState([]);
	const [activeFrom, setActiveFrom] = useState({});
	const [defaultIdentity, setDefaultIdentity] = useState();
	const allAccounts = useRoots();
	const { folderId } = useParams();

	const noName = useMemo(() => t('label.no_name', '<No Name>'), [t]);

	useEffect(() => {
		const identityList = map(account.identities.identity, (item, idx) => ({
			value: idx,
			label: `${item.name ?? ''}(${item._attrs?.zimbraPrefFromDisplay ?? ''}  <${
				item._attrs?.zimbraPrefFromAddress
			}>)`,
			address: item._attrs?.zimbraPrefFromAddress,
			fullname: item._attrs?.zimbraPrefFromDisplay ?? '',
			type: item._attrs.zimbraPrefFromAddressType,
			identityName: item.name ?? ''
		}));

		setDefaultIdentity(find(identityList, { identityName: 'DEFAULT' }));
		setFrom({
			address: find(identityList, (item) => item?.identityName === 'DEFAULT')?.address,
			fullName: find(identityList, (item) => item?.identityName === 'DEFAULT')?.fullname,
			name: find(identityList, (item) => item?.identityName === 'DEFAULT')?.address,
			type: ParticipantRole.FROM
		});

		setActiveFrom(find(identityList, (item) => item?.identityName === 'DEFAULT'));
		updateEditorCb({
			from: {
				address: defaultIdentity?.address,
				fullName: defaultIdentity?.fullname,
				name: defaultIdentity?.fullname,
				type: ParticipantRole.FROM
			}
		});

		const rightsList = flatten(
			map(
				filter(
					account?.rights?.targets,
					(rts) => rts.right === 'sendAs' || rts.right === 'sendOnBehalfOf'
				),
				(ele, idx) =>
					map(ele?.target, (item) => ({
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
						identityName: ''
					}))
			)
		);

		const flattenList = flatten(rightsList);

		const uniqueIdentityList = [...identityList];
		if (flattenList?.length) {
			map(flattenList, (ele) => {
				const uniqIdentity = findIndex(identityList, { address: ele.address });
				if (uniqIdentity < 0) uniqueIdentityList.push(ele);
			});
			setList(uniqueIdentityList);
		} else setList(identityList);
	}, [account, accounts, defaultIdentity?.address, defaultIdentity?.fullname, t, updateEditorCb]);

	useEffect(() => {
		if (!editorId?.includes('new-')) {
			const def = findDefaultIdentity({
				list,
				allAccounts,
				folderId
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
		}
	}, [action, allAccounts, editorId, folderId, list, updateEditorCb]);

	const identitiesList = useMemo(
		() =>
			list.map((el) => ({
				label: el.label,
				value: el.value,
				address: el.address,
				fullname: el.fullName,
				type: el.type,
				identityName: el.identityName,

				onClick: () => {
					setActiveFrom(el);
					const data = {
						address: el.address,
						fullName: el.fullname,
						name: el.address,
						type: ParticipantRole.FROM
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
					setOpen(false);
				},
				selected: el === activeFrom,
				customComponent: (
					<Container width="100%" crossAlignment="flex-start" height="fit">
						<Text weight="bold">{el.identityName || noName}</Text>
						{el.type === 'sendOnBehalfOf' ? (
							<Text color="gray1"> {el.label} </Text>
						) : (
							<Text color="gray1">{`${el.fullname} <${el.address}>`}</Text>
						)}
					</Container>
				)
			})),
		[accounts, activeFrom, list, noName, setOpen, updateEditorCb]
	);
	const hasIdentity = useMemo(() => defaultIdentity && list.length > 1, [defaultIdentity, list]);

	return { from, activeFrom, identitiesList, hasIdentity };
};
