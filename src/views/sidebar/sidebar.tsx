/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useRef, FC, useContext } from 'react';
import {
	AccordionFolder,
	Folder,
	useFoldersAccordionByView,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	useLocalStorage
} from '@zextras/carbonio-shell-ui';
import { Accordion, Container, Button, ModalManagerContext } from '@zextras/carbonio-design-system';
import { Route, Switch, useRouteMatch, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { filter, isEqual, uniqWith } from 'lodash';
import { useTranslation } from 'react-i18next';
import CollapsedSideBarItems from './collapsed-sidebar-items';
import { FOLDER_VIEW } from '../../constants';
import { AccordionCustomComponent } from './accordion-custom-component';
import { getShareInfo } from '../../store/actions/get-share-info';
import { SharesModal } from './shares-modal';
import { ResFolder } from '../../types/commons';
import useGetTagsAccordion from '../../hooks/use-get-tags-accordions';

type SidebarComponentProps = {
	accordions: Array<AccordionFolder>;
	openIds: Array<string>;
};

const SidebarComponent: FC<SidebarComponentProps> = ({ accordions, openIds }) => {
	const sidebarRef = useRef(null);
	const [t] = useTranslation();
	const dispatch = useDispatch();
	// eslint-disable-next-line @typescript-eslint/ban-types
	const createModal = useContext(ModalManagerContext) as Function;
	const { folderId } = useParams<{ folderId: string }>();
	const tagsAccordionItems = useGetTagsAccordion();

	return (
		<Container orientation="vertical" height="fit">
			<Accordion openIds={openIds} ref={sidebarRef} items={accordions} activeId={folderId} />
			<Container style={{ padding: '8px 16px' }}>
				<Button
					type="outlined"
					label={t('label.find_shares', 'Find shares')}
					color="primary"
					size="fill"
					onClick={(ev: MouseEvent): void => {
						ev.stopPropagation();
						dispatch(getShareInfo())
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							.then((res: any) => {
								if (res.type.includes('fulfilled') && res.payload?.share?.length > 0) {
									const resFolders: Array<ResFolder> = uniqWith(
										filter(res.payload.share, ['view', 'message']),
										isEqual
									);
									const closeModal = createModal(
										{
											children: (
												<SharesModal folders={resFolders} onClose={(): void => closeModal()} />
											)
										},
										true
									);
								}
							});
					}}
				/>
			</Container>
			<Accordion items={[tagsAccordionItems]} />
		</Container>
	);
};

type SidebarProps = {
	expanded: boolean;
};

const Sidebar: FC<SidebarProps> = ({ expanded }) => {
	const { path } = useRouteMatch();
	const [openIds, setOpenIds] = useLocalStorage<Array<string>>('open_mails_folders', []);

	const additionalProps = (item: AccordionFolder): Record<string, any> => ({
		onOpen: () => setOpenIds((s: Array<string>) => (s.includes(item.id) ? s : [...s, item.id])),
		onClose: () => setOpenIds((s: Array<string>) => s.filter((id: string) => id !== item.id))
	});

	const accordions = useFoldersAccordionByView(
		FOLDER_VIEW.message,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		AccordionCustomComponent,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		additionalProps
	);

	return (
		<>
			{expanded ? (
				<>
					<Switch>
						<Route path={`${path}/folder/:folderId/:type?/:itemId?`}>
							<SidebarComponent accordions={accordions} openIds={openIds} />
						</Route>
					</Switch>
				</>
			) : (
				accordions[0].items.map((folder: Folder, index: number) => (
					<CollapsedSideBarItems key={index} folder={folder} />
				))
			)}
		</>
	);
};

export default Sidebar;
