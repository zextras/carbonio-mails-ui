/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';
import {
	Container,
	Accordion,
	AccordionItem,
	Checkbox,
	Padding,
	Text,
	Input,
	Icon,
	Row,
	AccordionItemType,
	AccordionDivider
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
	toLower,
	isEmpty
} from 'lodash';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import ModalHeader from './commons/modal-header';
import ModalFooter from './commons/modal-footer';
import { createMountpoint } from '../../store/actions/create-mountpoint';

import { GroupedShare, SharedObject, ShareModalProps } from '../../types/sidebar';

const ContainerEl = styled(Container)`
	overflow-y: auto;
	display: block;
`;

// TODO remove the "any" after the Accordion component refactor in the DS
const CustomItem: FC<any> = ({ item: folder }) => {
	const [checked, setChecked] = useState(false);
	const [t] = useTranslation();

	const onClick = useCallback(() => {
		if (!checked) {
			folder.setLinks(
				uniqWith(
					[
						...folder.links,
						{
							id: folder.id,
							name: folder.label,
							folderId: folder.folderId,
							ownerId: folder.ownerId,
							ownerName: folder.ownerName,
							of: t('label.of', 'of')
						}
					],
					isEqual
				)
			);
		} else {
			folder.setLinks(filter(folder.links, (v) => v.id !== folder.id));
		}
		setChecked(!checked);
	}, [checked, folder, t]);

	return (
		<>
			<Padding right="medium">
				<Checkbox value={checked} onClick={onClick} iconColor="primary" />
			</Padding>
			<AccordionItem item={folder} />
		</>
	);
};

export const SharesModal: FC<ShareModalProps> = ({ folders, onClose }) => {
	const [links, setLinks] = useState([] as SharedObject[]);
	const [data, setData] = useState({});
	const dispatch = useDispatch();
	const [t] = useTranslation();

	const onConfirm = useCallback(() => {
		dispatch(createMountpoint(links));
		onClose();
	}, [dispatch, links, onClose]);

	const shared = map(
		folders,
		(c) =>
			({
				id: `${c.ownerName} - ${c.folderId} - ${c.granteeType} - ${c.granteeName}`,
				label: last(split(c.folderPath, '/')),
				open: true,
				items: [],
				ownerName: c.ownerName,
				ownerId: c.ownerId,
				checked: false,
				folderId: `${c.folderId}`,
				setLinks,
				links,
				CustomComponent: CustomItem
			} as SharedObject)
	);

	const filteredFolders = useMemo<GroupedShare>(() => groupBy(shared, 'ownerName'), [shared]);

	const nestedData = useMemo(() => {
		const shares = (isEmpty(data) ? filteredFolders : data) as GroupedShare;
		const sharesDets = values(shares);
		return sharesDets.map((v): AccordionItemType | AccordionDivider =>
			v
				? {
						id: v[0].ownerId,
						label: t('label.shares_items', {
							value: v[0].ownerName,
							defaultValue: "{{value}}'s shared folders"
						}),
						open: true,
						items: v,
						background: undefined
				  }
				: {
						divider: true
				  }
		);
	}, [data, filteredFolders, t]);

	const filterResults = useCallback(
		(ev) =>
			setData(
				pickBy(filteredFolders, (_value, key) =>
					startsWith(toLower(key), toLower(ev?.target?.value))
				)
			),
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
					CustomIcon={({ hasFocus }: { hasFocus: boolean }): ReactElement => (
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
