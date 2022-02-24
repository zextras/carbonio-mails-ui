/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
	Container,
	Accordion,
	AccordionItem,
	Checkbox,
	Padding,
	Text,
	Input,
	Icon,
	Row
} from '@zextras/carbonio-design-system';
import {
	groupBy,
	map,
	split,
	last,
	values,
	uniqWith,
	isEqual,
	filter,
	pickBy,
	startsWith,
	toLower
} from 'lodash';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { ModalHeader } from './commons/modal-header';
import ModalFooter from './commons/modal-footer';
import { createMountpoint } from '../../store/actions/create-mountpoint';

const ContainerEl = styled(Container)`
	overflow-y: auto;
	display: block;
`;

const CustomItem = ({ item }) => {
	const [checked, setChecked] = useState(false);
	const [t] = useTranslation();

	const onClick = useCallback(() => {
		if (!checked) {
			item.setLinks(
				uniqWith(
					[
						...item.links,
						{
							id: item.id,
							name: item.label,
							folderId: item.folderId,
							ownerId: item.ownerId,
							ownerName: item.ownerName,
							of: t('label.of', 'of')
						}
					],
					isEqual
				)
			);
		} else {
			item.setLinks(filter(item.links, (v) => v.id !== item.id));
		}
		setChecked(!checked);
	}, [checked, item, t]);

	return (
		<>
			<Padding right="medium">
				<Checkbox value={checked} onClick={onClick} iconColor="primary" />
			</Padding>
			<AccordionItem item={item} />
		</>
	);
};

export const SharesModal = ({ folders, onClose }) => {
	const [links, setLinks] = useState([]);
	const [data, setData] = useState();
	const dispatch = useDispatch();
	const [t] = useTranslation();

	const onConfirm = useCallback(() => {
		dispatch(createMountpoint(links));
		onClose();
	}, [dispatch, links, onClose]);

	const shared = map(folders, (c) => ({
		id: `${c.ownerName} - ${c.folderId} - ${c.granteeType} - ${c.granteeName}`,
		label: last(split(c.folderPath, '/')),
		open: true,
		items: [],
		ownerName: c.ownerName,
		ownerId: c.ownerId,
		checked: false,
		folderId: c.folderId,
		setLinks,
		links,
		CustomComponent: CustomItem
	}));
	const filteredFolders = useMemo(() => groupBy(shared, 'ownerName'), [shared]);
	const nestedData = useMemo(
		() =>
			map(values(data ?? filteredFolders), (v) => ({
				id: v[0].ownerId,
				label: t('label.shares_items', {
					value: v[0].ownerName,
					defaultValue: "{{value}}'s shared folders"
				}),
				open: true,
				items: v,
				divider: filteredFolders?.length > 0 || data?.length > 0,
				background: undefined
			})),
		[data, filteredFolders, t]
	);

	const filterResults = useCallback(
		(ev) => {
			setData(
				pickBy(filteredFolders, (value, key) =>
					startsWith(toLower(key), toLower(ev?.target?.value))
				)
			);
		},
		[filteredFolders]
	);

	return (
		<>
			<ModalHeader title={t('label.find_mail_shares', 'Find shared folders')} onClose={onClose} />
			<Row padding={{ top: 'large', bottom: 'small' }} width="fill" mainAlignment="flex-start">
				<Text>{t('label.find_shares', 'Find shares')}</Text>
			</Row>
			<Row padding={{ top: 'small', bottom: 'large' }} width="fill">
				<Input
					label={t('label.filter_user', 'Filter users')}
					backgroundColor="gray5"
					CustomIcon={({ hasFocus }) => (
						<Icon icon="FunnelOutline" size="large" color={hasFocus ? 'primary' : 'text'} />
					)}
					onChange={filterResults}
				/>
			</Row>
			<ContainerEl orientation="vertical" mainAlignment="flex-start" maxHeight="40vh">
				<Accordion items={nestedData} background="gray6" />
			</ContainerEl>
			<Row
				padding={{
					all: 'small'
				}}
				width="fill"
				mainAlignment="flex-end"
			>
				<ModalFooter
					onConfirm={onConfirm}
					label={t('label.add', 'Add')}
					disabled={links?.length <= 0}
				/>
			</Row>
		</>
	);
};
