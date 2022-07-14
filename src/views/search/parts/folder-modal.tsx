/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ChangeEvent, FC, ReactElement, useCallback, useMemo, useState } from 'react';
import {
	Container,
	CustomModal,
	Input,
	Text,
	Accordion,
	AccordionItem,
	Tooltip,
	Avatar,
	Icon,
	Row,
	Padding
} from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import { filter, isEmpty, reduce, startsWith } from 'lodash';

import {
	AccordionFolder,
	FOLDERS,
	useFoldersAccordionByView,
	useUserAccount
} from '@zextras/carbonio-shell-ui';

import styled from 'styled-components';
import { useSelector } from 'react-redux';
import ModalFooter from '../../sidebar/commons/modal-footer';
import { ModalHeader } from '../../sidebar/commons/modal-header';
import { selectFolders } from '../../../store/folders-slice';
import { FolderType } from '../../../types';
import { getFolderIconColor, getFolderTranslatedName } from '../../sidebar/utils';
import { FOLDER_VIEW } from '../../../constants';
import AccordionCustomComponent from './folder-accordion-custom-comp';

type ComponentProps = {
	compProps: { open: boolean; onClose: () => void; setFolder: (arg: any) => void; t: TFunction };
};
const ContainerEl = styled(Container)`
	overflow-y: auto;
	display: block;
`;
const FittedRow = styled(Row)`
	max-width: calc(100% - (2 * ${({ theme }): string => theme.sizes.padding.small}));
	height: 48px;
`;
const getFolderOwner = (item: any): string => {
	if (item.owner) return item.owner;
	if (item.parent) {
		return getFolderOwner(item.parent);
	}
	return item.name;
};

const CustomComponent: FC<{ item: AccordionFolder }> = ({ item }): ReactElement => (
	<FittedRow>
		<Padding horizontal="small">
			<Avatar label={item.label} size="medium" />
		</Padding>
		<Tooltip label={item.label} placement="right" maxWidth="100%">
			<AccordionItem item={item} />
		</Tooltip>
	</FittedRow>
);

type CustomComponent = {
	CustomComponent: ReactElement;
	divider: boolean;
	background: string | undefined;
	onClick: () => void;
	items: Array<any>;
};
const FolderSelectModal: FC<ComponentProps> = ({ compProps }): ReactElement => {
	const { open, onClose, setFolder, t } = compProps;

	const [input, setInput] = useState('');
	const [folderDestination, setFolderDestination] = useState<FolderType | any>({});

	const foldersFromStore = useSelector(selectFolders);

	const getFolderAbsPath = useCallback(
		(fid: string) => {
			const path = foldersFromStore[fid]?.path;
			return filter(path?.split('/'), (p) => p !== '').join('/');
		},
		[foldersFromStore]
	);
	const accountName = useUserAccount().name;
	const [openIds, setOpenIds] = useState(['USER_ROOT']);
	const additionalProps = (item: AccordionFolder): Record<string, any> => ({
		onClick: (): void => {
			setFolderDestination(item);
		},
		onOpen: () => setOpenIds((s: Array<string>) => (s.includes(item.id) ? s : [...s, item.id])),
		onClose: () => setOpenIds((s: Array<string>) => s.filter((id: string) => id !== item.id)),
		openIds
	});

	const accordions = useFoldersAccordionByView(
		FOLDER_VIEW.message,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		AccordionCustomComponent,
		additionalProps
	);

	const requiredAcc = useMemo(() => {
		const temp = reduce(
			accordions,
			(acc: Array<AccordionFolder & CustomComponent>, v) => {
				acc.push({
					id: v.id,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					CustomComponent,
					label:
						v.id === FOLDERS.USER_ROOT
							? accountName
							: getFolderTranslatedName({ t, folderId: v.id, folderName: v.label }),
					divider: true,
					items: v.items,
					background: folderDestination.id === v.id ? 'highlight' : undefined,
					onClick: () => {
						v.id !== FOLDERS.USER_ROOT && setFolderDestination(v);
					}
				});
				return acc;
			},
			[]
		);

		return temp;
	}, [accordions, accountName, folderDestination.id, t]);

	const filteredFolders = useMemo(
		() =>
			filter(requiredAcc, (v) => {
				if (isEmpty(v)) {
					return false;
				}

				const folderName = getFolderTranslatedName({
					t,
					folderId: v?.id,
					folderName: v?.label
				})?.toLowerCase();

				return startsWith(folderName, input.toLowerCase());
			}),
		[input, requiredAcc, t]
	);

	const onConfirm = useCallback(() => {
		const absoluteParent = getFolderOwner(folderDestination.folder);
		const relativePath = getFolderAbsPath(folderDestination?.id);
		const folderPath =
			absoluteParent === 'USER_ROOT' ? relativePath : `${absoluteParent}/${relativePath}`;

		setFolder([
			{
				label: `in:${folderPath}`,
				hasAvatar: true,
				maxWidth: '200px',
				isGeneric: false,
				background: 'gray2',
				avatarBackground: getFolderIconColor(folderDestination),
				avatarIcon: 'FolderOutline',
				isQueryFilter: true,
				value: `in:"${folderPath}"`
			}
		]);
		onClose();
	}, [folderDestination, setFolder, getFolderAbsPath, onClose]);

	const disabled = useMemo(() => isEmpty(folderDestination), [folderDestination]);

	return (
		<CustomModal open={open} onClose={onClose} maxHeight="90vh" size="medium">
			<Container
				padding={{ all: 'large' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<ModalHeader title={t('share.is_contained_in', 'Is contained in')} onClose={onClose} />
				<Container mainAlignment="center" crossAlignment="flex-start">
					<Container
						padding={{ all: 'small' }}
						mainAlignment="center"
						crossAlignment="flex-start"
						height="fit"
					>
						<Container
							padding={{ all: 'small' }}
							mainAlignment="center"
							crossAlignment="flex-start"
						>
							<Text overflow="break-word">
								{t(
									'share.filter_folder_message',
									'Select a folder where to start your advanced search'
								)}
							</Text>
						</Container>
						<Input
							inputName="test"
							label={t('label.filter_folders', 'Filter folders')}
							backgroundColor="gray5"
							value={input}
							CustomIcon={({ hasFocus }: { hasFocus: boolean }): ReactElement => (
								<Icon icon="FunnelOutline" size="large" color={hasFocus ? 'primary' : 'text'} />
							)}
							onChange={(e: ChangeEvent<HTMLInputElement>): void => setInput(e.target.value)}
						/>

						<ContainerEl
							orientation="vertical"
							mainAlignment="flex-start"
							minHeight="30vh"
							maxHeight="60vh"
						>
							<Accordion
								items={filteredFolders}
								activeId={folderDestination?.id}
								openIds={openIds}
							/>
						</ContainerEl>
					</Container>
					<ModalFooter
						onConfirm={onConfirm}
						secondaryAction={onClose}
						label={t('label.choose_folder', 'Choose folder')}
						secondaryLabel={t('label.go_back', 'Go Back')}
						disabled={disabled}
					/>
				</Container>
			</Container>
		</CustomModal>
	);
};

export default FolderSelectModal;
