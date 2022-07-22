/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo, useCallback, useState } from 'react';
import { Container, Text, Icon, Row, Padding } from '@zextras/carbonio-design-system';
import { map } from 'lodash';

import { Folder, getTags, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-shell-ui';
import Heading from '../../components/settings-heading';
import MoveToFolderModal from './move-to-folder-modal';
import FilterActionRows from './filter-action-rows';

type ComponentProps = any;

const FilterActionConditions: FC<ComponentProps> = ({ compProps }): ReactElement => {
	const { t, tempActions, setTempActions } = compProps;
	const [open, setOpen] = useState(false);
	const [activeIndex, setActiveIndex] = useState(0);
	const tagOptions = useMemo(
		() =>
			map(getTags(), (item) => ({
				...item,
				label: item.name,
				customComponent: (
					<Row>
						<Icon icon="Tag" customColor={ZIMBRA_STANDARD_COLORS[item.color ?? 0].hex} />
						<Padding left="small">
							<Text>{item.name}</Text>
						</Padding>
					</Row>
				)
			})),
		[]
	);
	const [folderDestination, setFolderDestination] = useState<Folder | any>({});
	const [folder, setFolder] = useState<Folder | any>({});
	const onModalClose = useCallback(() => {
		setFolder({});
		setOpen(false);
	}, []);
	const modalProps = useMemo(
		() => ({
			open,
			onClose: onModalClose,
			t,
			setOpen,
			activeIndex,
			setActiveIndex,
			tempActions,
			setTempActions,
			folderDestination,
			setFolderDestination,
			folder,
			setFolder
		}),
		[open, onModalClose, t, activeIndex, tempActions, setTempActions, folderDestination, folder]
	);

	return (
		<>
			<Container padding={{ top: 'medium' }} crossAlignment="flex-start" mainAlignment="flex-start">
				<Heading title={t('settings.actions', 'Actions')} size="medium" />
				<Text>{t('settings.perform_following_action', 'Perform the following actions:')}</Text>
				<Container padding={{ top: 'small' }} mainAlignment="flex-start">
					{map(tempActions, (tempAction, index) => (
						<FilterActionRows
							key={tempAction.id}
							index={index}
							tmpFilter={tempAction}
							compProps={compProps}
							modalProps={modalProps}
							tagOptions={tagOptions}
						/>
					))}
				</Container>
			</Container>
			<MoveToFolderModal compProps={modalProps} />
		</>
	);
};

export default FilterActionConditions;
