/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act } from 'react';

import { screen, waitFor } from '@testing-library/react';
import { FOLDERS, useTagStore } from '@zextras/carbonio-ui-commons';
import { useParams } from 'react-router-dom';
import type { Mock } from 'vitest';

import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { tags as mockTags } from '@test-utils/tags/tags';
import { generateMessage } from '__test__/generators/generateMessage';
import { openMessageStandalonePreview } from 'helpers/external-tabs';
import { MessageListItemProps } from 'types/folder';
import { MsgActionRequest } from 'types/soap/msg-action';
import { createEditBoard } from 'views/app/detail-panel/edit/edit-view-board';
import { MessageListItem } from 'views/app/folder-panel/messages/message-list-item';

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useParams: vi.fn()
}));

vi.mock('helpers/external-tabs', () => ({
	openMessageStandalonePreview: vi.fn(),
	isFocusModeMailView: vi.fn().mockReturnValue(false)
}));

vi.mock('views/app/detail-panel/edit/edit-view-board', () => ({
	createEditBoard: vi.fn()
}));

describe('MessageListItem Component', () => {
	const message = generateMessage({ id: '1' });
	const defaultProps: MessageListItemProps = {
		message,
		selected: false,
		selecting: false,
		isConvChildren: false,
		visible: true,
		active: false,
		isSearchModule: false,
		handleReplaceHistory: vi.fn(),
		index: 0,
		onSelect: vi.fn()
	};

	beforeEach(() => {
		(useParams as Mock).mockReturnValue({
			folderId: '2',
			itemId: '1'
		});
	});

	it('should setupTest the component without crashing', () => {
		setupTest(<MessageListItem {...defaultProps} />);
		expect(screen.getByTestId(`MessageListItem-${defaultProps.message.id}`)).toBeInTheDocument();
	});

	it('should render a subject component', () => {
		const props = { ...defaultProps, message: { ...defaultProps.message, subject: '' } };
		setupTest(<MessageListItem {...props} />);
		expect(screen.getByTestId('Subject')).toBeVisible();
	});

	it('should display a fragment component', () => {
		const props = {
			...defaultProps,
			message: { ...defaultProps.message, fragment: 'test fragment' }
		};
		setupTest(<MessageListItem {...props} />);
		expect(screen.getByTestId('Fragment')).toBeVisible();
	});

	it('should display the correct icon for an unread message', () => {
		const props = { ...defaultProps, message: { ...defaultProps.message, read: false } };
		setupTest(<MessageListItem {...props} />);
		expect(screen.getByTestId('UnreadIcon')).toBeInTheDocument();
	});

	it('should display the correct icon for a read message', () => {
		const props = { ...defaultProps, message: { ...defaultProps.message, read: true } };
		setupTest(<MessageListItem {...props} />);
		expect(screen.getByTestId('ReadIcon')).toBeInTheDocument();
	});

	it('should display the correct icon for a draft message', () => {
		const props = { ...defaultProps, message: { ...defaultProps.message, isDraft: true } };
		setupTest(<MessageListItem {...props} />);
		expect(screen.getByTestId('DraftIcon')).toBeInTheDocument();
	});

	it('should display the correct icon for a replied message', () => {
		const props = { ...defaultProps, message: { ...defaultProps.message, isReplied: true } };
		setupTest(<MessageListItem {...props} />);
		expect(screen.getByTestId('RepliedIcon')).toBeInTheDocument();
	});

	it('should display the correct icon for a forwarded message', () => {
		const props = { ...defaultProps, message: { ...defaultProps.message, isForwarded: true } };
		setupTest(<MessageListItem {...props} />);
		expect(screen.getByTestId('ForwardedIcon')).toBeInTheDocument();
	});

	it('should display the correct icon for a sent message', () => {
		const props = { ...defaultProps, message: { ...defaultProps.message, isSentByMe: true } };
		setupTest(<MessageListItem {...props} />);
		expect(screen.getByTestId('SentIcon')).toBeInTheDocument();
	});

	it('should display the attachment icon if the message has an attachment', () => {
		const props = { ...defaultProps, message: { ...defaultProps.message, hasAttachment: true } };
		setupTest(<MessageListItem {...props} />);
		expect(screen.getByTestId('AttachmentIcon')).toBeInTheDocument();
	});

	it('should display the flag icon if the message is flagged', () => {
		const props = { ...defaultProps, message: { ...defaultProps.message, flagged: true } };
		setupTest(<MessageListItem {...props} />);
		expect(screen.getByTestId('FlagIcon')).toBeInTheDocument();
	});

	it('should display the urgent icon if the message is urgent', () => {
		const props = { ...defaultProps, message: { ...defaultProps.message, urgent: true } };
		setupTest(<MessageListItem {...props} />);
		expect(screen.getByTestId('UrgentIcon')).toBeInTheDocument();
	});

	it('should display the tag icon if the message has tags', () => {
		const props = {
			...defaultProps,
			message: { ...defaultProps.message, tags: [Object.entries(mockTags)[0][0]] }
		};

		useTagStore.setState({ tags: mockTags });
		setupTest(<MessageListItem {...props} />);
		expect(screen.getByTestId('TagIcon')).toBeInTheDocument();
	});

	it('in search module it should display the correct folder badge if the message is in a different folder', () => {
		populateFoldersStore();
		const props = {
			...defaultProps,
			message: { ...defaultProps.message, isSearchModule: true, parent: FOLDERS.TRASH }
		};
		setupTest(<MessageListItem {...props} />);
		expect(screen.getByTestId('FolderBadge')).toBeInTheDocument();
	});

	it('should call the onClick handler when the message is clicked', async () => {
		createSoapAPIInterceptor<MsgActionRequest>('MsgAction');

		const handleReplaceHistory = vi.fn();
		const props = { ...defaultProps, handleReplaceHistory };
		const { user } = setupTest(<MessageListItem {...props} />);

		const actionWrapper = await screen.findByTestId(`MessageListItem-${defaultProps.message.id}`);

		user.hover(actionWrapper);

		const hoverContainer = await screen.findByTestId(/hover-container-/);

		await act(async () => {
			user.click(hoverContainer);
		});

		await waitFor(async () => {
			expect(handleReplaceHistory).toHaveBeenCalled();
		});
	});

	it('should call the msgPreview handler handler when the message is doubleClicked', async () => {
		createSoapAPIInterceptor<MsgActionRequest>('MsgAction');
		const { user } = setupTest(<MessageListItem {...defaultProps} />);

		const actionWrapper = await screen.findByTestId(`MessageListItem-${defaultProps.message.id}`);

		user.hover(actionWrapper);

		const hoverContainer = await screen.findByTestId(/hover-container-/);

		await act(async () => {
			user.dblClick(hoverContainer);
		});

		await waitFor(async () => {
			expect(openMessageStandalonePreview).toHaveBeenCalled();
		});
	});

	it('should call the editDraft handler when the draft message is doubleClicked', async () => {
		const props = {
			...defaultProps,
			message: { ...defaultProps.message, isDraft: true, parent: FOLDERS.DRAFTS }
		};
		(useParams as Mock).mockReturnValue({
			folderId: FOLDERS.DRAFTS,
			itemId: '1'
		});

		const { user } = setupTest(<MessageListItem {...props} />);

		const actionWrapper = await screen.findByTestId(`MessageListItem-${defaultProps.message.id}`);
		await user.hover(actionWrapper);
		const hoverContainer = await screen.findByTestId(/hover-container-/);
		await user.dblClick(hoverContainer);

		expect(createEditBoard).toHaveBeenCalled();
	});

	it('should display the scheduled time if the message is scheduled', () => {
		const props = {
			...defaultProps,
			message: {
				...defaultProps.message,
				isScheduled: true,
				autoSendTime: Number(new Date())
			}
		};

		setupTest(<MessageListItem {...props} />);

		expect(screen.getByText('label.send_scheduled')).toBeVisible();
		expect(screen.getByText('message.schedule_time')).toBeVisible();
	});
});
