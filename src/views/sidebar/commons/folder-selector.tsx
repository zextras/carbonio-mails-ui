import { Accordion, Button, Container, Input, Padding } from '@zextras/carbonio-design-system';
import {
	AccordionFolder,
	Folder,
	FOLDERS,
	getFolder,
	t,
	useFoldersAccordionByView,
	useUserAccount
} from '@zextras/carbonio-shell-ui';
import React, {
	ChangeEvent,
	ReactElement,
	useCallback,
	useLayoutEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { filter, startsWith } from 'lodash';
import styled from 'styled-components';
import { FOLDER_VIEW } from '../../../constants';
import ModalAccordionCustomComponent from '../parts/edit/modal-accordion-custom-component';
import { getFolderTranslatedName } from '../utils';

const ContainerEl = styled(Container)`
	overflow-y: auto;
	display: block;
`;

type FolderSelectorProps = {
	inputLabel?: string;
	onNewFolderClick?: () => void;
	folderId: string;
	folderDestination: Folder | undefined;
	setFolderDestination: (arg: Folder) => void;
};

export const FolderSelector = ({
	inputLabel,
	onNewFolderClick,
	folderId,
	folderDestination,
	setFolderDestination
}: FolderSelectorProps): ReactElement => {
	const [inputValue, setInputValue] = useState('');
	const accountName = useUserAccount().name;
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const folders = useFoldersAccordionByView(FOLDER_VIEW.message, null);
	const folder = getFolder(folderId);

	const accordionRef = useRef<HTMLDivElement>();
	const [accordionWidth, setAccordionWidth] = useState<number>();

	useLayoutEffect(() => {
		const calculateAvailableWidth = (): void => {
			if (accordionRef && accordionRef.current) {
				setAccordionWidth(accordionRef?.current?.clientWidth);
			}
		};
		window.addEventListener('resize', calculateAvailableWidth);
		return (): void => window.removeEventListener('resize', calculateAvailableWidth);
	}, [accordionRef]);

	const getFolderRootName = useCallback((id: any): string | undefined => {
		const _folder = getFolder(id);
		if (_folder?.parent) {
			return getFolderRootName(_folder.l);
		}
		if (_folder) {
			return _folder.name;
		}
		return undefined;
	}, []);

	const rootName = useMemo(() => getFolderRootName(folderId), [folderId, getFolderRootName]);

	const filteredFolders = folders.filter((item) => item.label === rootName);

	const flattenFolders = useCallback(
		(arr: Array<AccordionFolder>): Array<AccordionFolder> => {
			const result: Array<AccordionFolder> = [];
			arr.forEach((item) => {
				const { items } = item;
				if (
					item.folder.id !== FOLDERS.TRASH &&
					item.folder.id !== FOLDERS.SPAM &&
					!startsWith(item.folder.absFolderPath, '/Trash')
				)
					result.push({
						...item,
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						CustomComponent: ModalAccordionCustomComponent,
						onClick: () => {
							setFolderDestination(item.folder);
						},
						background:
							typeof folderDestination !== 'undefined' && folderDestination.id === item.folder.id
								? 'highlight'
								: undefined,
						label:
							item.folder.id === FOLDERS.USER_ROOT
								? accountName
								: getFolderTranslatedName({
										folderId: item.folder.id,
										folderName: item.folder.name
								  }),
						activeId: item.folder.id === folderId,
						accordionWidth,
						items: []
					});
				if (items) result.push(...flattenFolders(items));
			});
			return result;
		},
		[folderDestination, accountName, folderId, accordionWidth, setFolderDestination]
	);

	const flattenedFolders = useMemo(
		() => flattenFolders(filteredFolders),
		[filteredFolders, flattenFolders]
	);

	const filteredFromUserInput = useMemo(
		() =>
			filter(flattenedFolders, (item) => {
				const folderName = item.label.toLowerCase();
				return startsWith(folderName, inputValue.toLowerCase());
			}),
		[flattenedFolders, inputValue]
	);

	return folder ? (
		<>
			<Input
				inputName={folder?.name}
				label={inputLabel ?? t('label.filter_folders', 'Filter folders')}
				backgroundColor="gray5"
				value={inputValue}
				onChange={(e: ChangeEvent<HTMLInputElement>): void => setInputValue(e.target.value)}
			/>
			<Padding vertical="medium" />
			<ContainerEl
				orientation="vertical"
				mainAlignment="flex-start"
				minHeight="30vh"
				maxHeight="60vh"
			>
				<Accordion
					background="gray6"
					items={filteredFromUserInput as any[]}
					style={{ overflowY: 'hidden' }}
				/>
			</ContainerEl>
			{onNewFolderClick && (
				<Container
					padding={{ top: 'medium', bottom: 'medium' }}
					mainAlignment="center"
					crossAlignment="flex-start"
				>
					<Button
						type="ghost"
						label={t('label.new_folder', 'New Folder')}
						color="primary"
						onClick={onNewFolderClick}
					/>
				</Container>
			)}
		</>
	) : (
		<></>
	);
};
