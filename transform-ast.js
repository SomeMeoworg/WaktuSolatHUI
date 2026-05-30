module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Rename md-switch to Switch, md-slider to Slider, md-tabs to Tabs, md-primary-tab to Tab, etc
  const tagMap = {
    'md-switch': 'Switch',
    'md-slider': 'Slider',
    'md-tabs': 'Tabs',
    'md-primary-tab': 'Tab',
    'md-outlined-select': 'Select',
    'md-select-option': 'SelectItem',
    'md-icon-button': 'Button',
    'md-filled-tonal-icon-button': 'Button',
    'md-filled-button': 'Button',
    'md-outlined-button': 'Button',
    'md-text-button': 'Button',
    'md-filter-chip': 'Button',
  };

  root.find(j.JSXElement).forEach(path => {
    const openingElement = path.node.openingElement;
    let tagName = openingElement.name.name;
    
    if (tagMap[tagName]) {
      const newName = tagMap[tagName];
      openingElement.name.name = newName;
      if (path.node.closingElement) {
        path.node.closingElement.name.name = newName;
      }

      // Handle attributes
      let attrs = openingElement.attributes;
      
      if (tagName === 'md-switch') {
        attrs.forEach(attr => {
          if (attr.name && attr.name.name === 'selected') attr.name.name = 'isSelected';
          if (attr.name && attr.name.name === 'icons') attr.name.name = 'removeMe';
        });
      }

      if (tagName === 'md-slider') {
        attrs.forEach(attr => {
          if (attr.name && attr.name.name === 'min') attr.name.name = 'minValue';
          if (attr.name && attr.name.name === 'max') attr.name.name = 'maxValue';
          if (attr.name && attr.name.name === 'ticks') attr.name.name = 'showSteps';
          if (attr.name && attr.name.name === 'labeled') attr.name.name = 'removeMe2';
        });
        attrs.push(j.jsxAttribute(j.jsxIdentifier('className'), j.stringLiteral('max-w-md')));
      }

      if (tagName === 'md-select-option') {
        attrs.forEach(attr => {
          if (attr.name && attr.name.name === 'value') attr.name.name = 'key';
        });
      }
      
      if (tagName === 'md-outlined-select') {
        attrs.push(j.jsxAttribute(j.jsxIdentifier('className'), j.stringLiteral('max-w-xs')));
        attrs.push(j.jsxAttribute(j.jsxIdentifier('variant'), j.stringLiteral('bordered')));
      }
      
      if (tagName === 'md-icon-button') {
        attrs.push(j.jsxAttribute(j.jsxIdentifier('isIconOnly')));
        attrs.push(j.jsxAttribute(j.jsxIdentifier('variant'), j.stringLiteral('light')));
      }
      if (tagName === 'md-filled-tonal-icon-button') {
        attrs.push(j.jsxAttribute(j.jsxIdentifier('isIconOnly')));
        attrs.push(j.jsxAttribute(j.jsxIdentifier('variant'), j.stringLiteral('flat')));
      }
      
      if (tagName === 'md-filter-chip') {
        // Find label and selected
        let label = '';
        let isSelected = false;
        attrs.forEach(attr => {
          if (attr.name && attr.name.name === 'label') {
             if (attr.value.type === 'StringLiteral') label = attr.value.value;
             else if (attr.value.type === 'JSXExpressionContainer') {
                // Keep the expression
             }
          }
        });
        // We will just do basic mapping. To make it simple, we just set it as a flat Button.
        attrs.push(j.jsxAttribute(j.jsxIdentifier('size'), j.stringLiteral('sm')));
      }

      // Remove unwanted attrs
      openingElement.attributes = attrs.filter(attr => attr.name && attr.name.name !== 'removeMe' && attr.name.name !== 'removeMe2');
    }
    
    // Remove md-ripple
    if (tagName === 'md-ripple') {
       j(path).remove();
    }
    
    // Remove md-icon if it has slot="icon"
    if (tagName === 'md-icon') {
       let hasSlot = openingElement.attributes.some(attr => attr.name && attr.name.name === 'slot');
       if (hasSlot) j(path).remove();
    }
  });

  return root.toSource();
};
