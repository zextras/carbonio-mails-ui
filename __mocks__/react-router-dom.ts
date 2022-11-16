import { FOLDERS } from "@zextras/carbonio-shell-ui";

export const useHistory = jest.fn(() => ({
	location: {
		pathname: 'fakepath'
	},
	push: jest.fn()
}));

export const useParams = jest.fn(() => ({ folderId : FOLDERS.INBOX}));