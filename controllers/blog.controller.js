const Blog = require('../models/blog');

const createBlog = async (req, res) => {
  try {
    // Destructure the allowed fields from req.body
    const { title, content, excerpt, category, tags, status } = req.body;

    // Construct the blog object
    const blogData = {
      title,
      content,
      excerpt,
      category,
      tags,
      status,
      author: req.user.id, 
    };

    // Create the blog
    const post = await Blog.create(blogData);
    await post.populate('author', 'name email');

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ message: error.message });
  }
};


const updateBlog = async (req, res) => {
  try {
    // Destructure the allowed fields from req.body
    const { title, content, excerpt, category, tags, status } = req.body;

    // Construct the updated data object
    const updatedData = {
      ...(title && { title }),
      ...(content && { content }),
      ...(excerpt && { excerpt }),
      ...(category && { category }),
      ...(tags && { tags }),
      ...(status && { status }),
    };

    // Update the blog in the database
    const blogUpdate = await Blog.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    if (!blogUpdate) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.status(200).json(blogUpdate);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    
    if (!deletedBlog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, tags } = req.query;
    
    // Build query
    let query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (tags) query.tags = { $in: tags.split(',') };
    
    const blogs = await Blog.find(query)
      .populate('author', 'name email')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Blog.countDocuments(query);
    
    res.status(200).json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name email');
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    // Increment view count
    blog.views += 1;
    await blog.save();
    
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPublishedBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tags } = req.query;
    
    let query = { status: 'published' };
    if (category) query.category = category;
    if (tags) query.tags = { $in: tags.split(',') };
    
    const blogs = await Blog.find(query)
      .populate('author', 'name email')
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Blog.countDocuments(query);
    
    res.status(200).json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
  getPublishedBlogs
};
