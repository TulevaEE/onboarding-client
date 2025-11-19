# React Testing Library Best Practices

## Core Principle
> Test your software the way users use it, not implementation details.

## Query Priority Order

### 1. Preferred Queries (Use these first)
- `getByRole('button', { name: /submit/i })` - Best for most elements
- `getByLabelText('Email')` - For form fields
- `getByText(/welcome/i)` - For non-interactive text
- `getByPlaceholderText()` - When no label exists

### 2. Semantic Queries
- `getByAltText()` - For images
- `getByTitle()` - Use sparingly

### 3. Last Resort
- `getByTestId()` - Only when semantic queries don't work

## Good Example
```javascript
// ✅ DO THIS
expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
expect(screen.getByText(/6%/)).toBeInTheDocument();
const actionLink = screen.getByRole('link');
expect(screen.queryByRole('button')).not.toBeInTheDocument();
```

## Bad Example
```javascript
// ❌ AVOID THIS
expect(wrapper.state('isOpen')).toBe(false);  // Testing state
expect(container.querySelector('.btn')).toBeInTheDocument();  // CSS selectors
expect(screen.getByTestId('submit-btn')).toBeInTheDocument();  // TestId when role works
```

## Testing Pattern for Intl Apps
```javascript
const renderWithIntl = (component) =>
  render(
    <IntlProvider locale="en" messages={translations.en} onError={(err) => {
      if (err.code === 'MISSING_TRANSLATION') return;
      throw err;
    }}>
      {component}
    </IntlProvider>
  );
```

## Clean Code Principles
- **Write self-documenting code** - Code should be clear without comments
- **Remove unnecessary comments** - If the code is clear, the comment is redundant
- **Use descriptive test names** - Test names should describe what is being tested
- **Use existing fixtures** - Avoid creating incomplete objects, use fixtures to prevent TypeScript errors

## Key Rules
1. Use semantic queries (getByRole, getByLabelText)
2. Avoid implementation details (state, methods, shallow rendering)
3. Use queryBy* when element might not exist
4. Test what users see and do, not how it works
5. Keep code clean and self-documenting